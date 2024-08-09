import { Router, Request, Response, response } from "express";
import { pgClient } from "../utils/pgClient";
import { getTaskRelation } from "../utils/getTaskRelation";
import { getMinDuration } from "../utils/MinDuration";
import { ObjectFlags } from "typescript";
import { parse } from "path";

export const taskRouter = Router()

taskRouter.get("/", inspectTask)
taskRouter.post("/", createTask)
taskRouter.post("/relation", createTaskRelation)
taskRouter.post("/userTaskRelation", userTaskRelation)
taskRouter.put("/", updateTask)
taskRouter.put("/finish", finishTask)
taskRouter.delete("/relation", deleteTaskRelation)
taskRouter.delete("/", deleteTask)

//request taskId
async function inspectTask(req: Request, res: Response) {
    try {
        let targetId = req.query.id
        const targetTask = (await pgClient.query(`select * from tasks where tasks.id = $1 `, [req.query.id])).rows[0]
        let taskRelation = await getTaskRelation(targetId!.toString())
        if (targetTask == undefined) {
            res.status(400).json({ message: "Cannot find target task" })
            return
        }
        targetTask.relation = taskRelation
        res.json({ data: targetTask })
    } catch (error) {
        console.log(error)
        res.status(500).json({ message: "Internal Server Error" })
    }
}




// request projectId, taskName,description,deadline,StartDate,duration,PreReqTask
async function createTask(req: Request, res: Response) {
    try {

        let { projectId, taskName, startDate, duration } = req.body
        const targetProject = (await pgClient.query(`select * from projects where id = $1`, [projectId])).rows[0]
        if (targetProject == undefined) {
            res.status(400).json({ message: "Cannot find target project" })
            return
        }
        const rootTask = await getRootTask(projectId)
        const newTask = (await pgClient.query(`insert into tasks (project_id, name, start_date, duration,pre_req_fulfilled) VALUES ($1,$2,$3,$4,true) returning *`, [projectId, taskName, startDate, duration])).rows[0]
        await pgClient.query(`insert into task_relation (task_id,pre_req_task_id) values ($1,$2)`, [newTask.id, rootTask])

        res.json({ message: "create new task successfully", data: newTask })
    } catch (error) {
        console.log(error)
        res.status(500).json({ message: "Internal Server Error" })

    }
}

async function createTaskRelation(req: Request, res: Response) {
    try {
        const { projectId, preTask, taskId } = req.body
        console.log(req.body);

        if (parseInt(preTask) < parseInt(taskId)) {
            const rootTaskId = await getRootTask(projectId)
            await pgClient.query(`DELETE FROM task_relation where task_id = $1 and pre_req_task_id = $2`, [taskId, rootTaskId])
            const ifExist = (await pgClient.query(`select * from task_relation where task_id = $1 and pre_req_task_id = $2`, [taskId, preTask])).rows[0]
            if (!ifExist) {
                await pgClient.query(`insert into task_relation (task_id, pre_req_task_id) values ($1,$2)`, [taskId, preTask])
            }
            await changeProjectDuration(projectId)
            await checkpreReqTask(preTask)
            res.json({ message: "update sucessfully" })
        } else (
            res.json({ message: "invalid relation" })
        )
    } catch (error) {
        console.log(error)
        res.status(500).json({ message: "Internal Server Error" })
    }
}

async function userTaskRelation(req: Request, res: Response) {
    try {
        const { taskId, userId, projectId } = req.body


        const userProjectRelationId = (await pgClient.query(`select * from user_project_relation where user_id = $1 and project_id = $2`, [userId, projectId])).rows[0].id
        // console.log(userProjectRelationId);
        if (!userProjectRelationId) {
            res.status(400).json({ message: "The user is not involved in this project" })
        }

        const taskAssigned = (await pgClient.query(`select * from user_task_relation where task_id = $1`, [taskId])).rows[0]


        if (taskAssigned) {
            await pgClient.query(`update user_task_relation set user_project_relation_id = $1, task_id = $2 where id = $3`, [userProjectRelationId, taskId, taskAssigned.id])
        } else {
            await pgClient.query(`insert into user_task_relation (user_project_relation_id,task_id) values ($1,$2)`, [userProjectRelationId, taskId])
        }
        res.json({ message: "success" })
    } catch (error) {
        console.log(error)
        res.status(500).json({ message: "Internal Server Error" })
    }
}


// id, name,description,duration,start_date,deadline
async function updateTask(req: Request, res: Response) {
    try {
        const { projectId, taskId, taskName, duration, startDate, finishDate } = req.body

        if (finishDate == "finished") {
            await pgClient.query(`UPDATE tasks SET actual_finish_date = NOW() where id = $1`, [taskId])
        } else {
            await pgClient.query(`UPDATE tasks SET actual_finish_date = null where id = $1`, [taskId])
        }

        const updatedTask = (await pgClient.query(`UPDATE tasks SET name = $1,duration = $2,start_date = $3 WHERE id = $4 returning *`, [taskName, duration, startDate, taskId])).rows[0]
        await checkpreReqTask(taskId)
        const checkAllTask = (await pgClient.query(`select * from tasks where project_id = $1 and actual_finish_date is null`, [projectId])).rows

        if (checkAllTask.length == 0) {
            await pgClient.query(`update projects set actual_finish_date = NOW() where id = $1`, [projectId])
        }

        await changeProjectDuration(projectId)
        res.json({ message: "updated successfully", data: updatedTask })
    } catch (error) {
        console.log(error)
        res.status(500).json({ message: "Internal Server Error" })
    }
}

async function finishTask(req: Request, res: Response) {
    try {
        const taskId = req.body.id
        const projectId = req.body.projectId
        await pgClient.query(`update tasks set actual_finish_date = NOW() where id = $1`, [taskId])
        await checkpreReqTask(taskId)
        const checkAllTask = (await pgClient.query(`select * from tasks where project_id = $1 and actual_finish_date is null`, [projectId])).rows

        if (checkAllTask.length == 0) {
            await pgClient.query(`update projects set actual_finish_date = NOW() where id = $1`, [projectId]);
        }

        res.status(200).json({ message: "finish task successfully" })
    } catch (error) {
        console.log(error)
        res.status(500).json({ message: "Internal Server Error" })
    }
}



async function deleteTaskRelation(req: Request, res: Response) {
    try {
        const { projectId, preTask, taskId } = req.body
        const rootTaskId = await getRootTask(projectId)
        await pgClient.query(`DELETE FROM task_relation where task_id = $1 and pre_req_task_id = $2`, [taskId, preTask])
        const checkRelation = (await pgClient.query(`select * from task_relation where task_id = $1`, [taskId])).rows[0]
        if (!checkRelation) {
            await pgClient.query(`insert into task_relation (task_id,pre_req_task_id) values ($1,$2) returning *`, [taskId, rootTaskId])
            await pgClient.query(`update tasks set pre_req_fulfilled = true where id = $1`, [taskId])
        }
        await changeProjectDuration(projectId)
        res.json({ message: "Delete Successfully" })
    } catch (error) {
        console.log(error)
        res.status(500).json({ message: "Internal Server Error" })
    }

}

//request: taskId
async function deleteTask(req: Request, res: Response) {
    try {
        await pgClient.query(`DELETE FROM task_relation where task_id = $1 or pre_req_task_id = $1`, [req.body.taskId])
        await pgClient.query(`DELETE FROM tasks where id = $1`, [req.body.taskId])
        await changeProjectDuration(req.body.projectId)
        res.json({ message: "Delete Successfully" })
    } catch (error) {
        console.log(error)
        res.status(500).json({ message: "Internal Server Error" })
    }

}



async function changeProjectDuration(projectId: string) {
    const rootTaskId = await getRootTask(projectId)
    const newDuration = await getMinDuration(rootTaskId)
    await pgClient.query(`UPDATE projects SET min_duration = $1 WHERE id = $2`, [newDuration, projectId])
    return
}

async function getRootTask(projectId: string) {
    const rootTaskId = (await pgClient.query(`select id from tasks where project_id = $1 order by id ASC LIMIT 1`, [projectId])).rows[0].id
    return rootTaskId
}

async function checkpreReqTask(taskId: string) {
    const data = (await pgClient.query(`select task_id from task_relation where pre_req_task_id = $1`, [taskId])).rows
    const postTasks = data.map((elem) => { return elem.task_id })

    for (let postTask of postTasks) {
        const preTasks = (await pgClient.query(`select pre_req_task_id from task_relation where task_id = $1`, [postTask])).rows
        for (let preTask of preTasks) {
            const checkPreTask = (await pgClient.query(`select actual_finish_date from tasks where id = $1`, [preTask.pre_req_task_id])).rows
            const checkCondition = checkPreTask.filter((elem) => { return !elem.actual_finish_date })
            await pgClient.query(`update tasks set pre_req_fulfilled = ${checkCondition.length == 0} where id = $1`, [postTask])

        }
    }
}

