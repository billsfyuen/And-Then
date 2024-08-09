import { Request, Response, Router } from "express";
import { pgClient } from "../utils/pgClient";

export const mainPageDisplayRouter = Router();

mainPageDisplayRouter.get('/', getMainPageInfo)


function serverError(err: any, res: Response) {
    console.log(err)
    res.status(500).json({ message: 'Server internal error.' })
}


function getFinishDate(startDate: any, durationInDay: number) {
    let date = new Date(startDate);

    date.setDate(date.getDate() + durationInDay);

    let year = date.getFullYear();
    let month = String(date.getMonth() + 1).padStart(2, '0');
    let day = String(date.getDate()).padStart(2, '0');
    return `${year}${month}${day}`;
}


const currentDate = new Date();
let currentYear = (String(currentDate.getFullYear()));
let currentMonth = (String(currentDate.getMonth() + 1).padStart(2, '0'));
let currentDay = (String(currentDate.getDate()).padStart(2, '0'));
let today = Number(`${currentYear}${currentMonth}${currentDay}`);


async function getUserInfo(userId: any) {
    return (await pgClient.query(
        `SELECT id, username, email, profile_image, first_name, last_name, organization, location, last_login, registration_date FROM users WHERE id = $1`,
        [userId])).rows[0];
}

async function getCurrentProjects(userId: any) {
    return (await pgClient.query(`
    SELECT user_id, project_id, projects.name, projects.image, permission_level, min_duration 
        FROM user_project_relation 
        INNER JOIN projects 
        ON project_id = projects.id
        WHERE actual_finish_date ISNULL AND user_id = $1
        ORDER BY projects.id DESC;`, [userId])).rows
}

async function getCurrentTask(projectId: any) {

    return (await pgClient.query(`
    SELECT project_id, tasks.id as task_id , tasks.name, 
        to_char(tasks.start_date, 'YYYY-MM-DD') AS task_start_date,
        duration, tasks.actual_finish_date 
        FROM tasks INNER JOIN projects
        ON project_id = projects.id
        WHERE project_id = $1 
        AND (CURRENT_TIMESTAMP > tasks.start_date) 
        AND tasks.actual_finish_date ISNULL
        ORDER BY tasks.start_date ASC;`, [projectId])).rows
}

async function getAllFinishedProjects(userId: any) {
    return (await pgClient.query(`
    SELECT project_id, name, image, 
        to_char(actual_finish_date, 'YYYY-MM-DD') AS actual_finish_date 
        FROM projects 
        INNER JOIN user_project_relation
        ON project_id = projects.id
        WHERE user_id = $1 AND actual_finish_date IS NOT NULL
        ORDER BY actual_finish_date DESC;`, [userId])).rows
}

async function getMainPageInfo(req: Request, res: Response) {
    let { userId } = req.query;

    try {
        let currentTaskInfo = [];
        let allOverrunTasks = [];
        let meetDeadlineTasks = [];

        let userInfo = await getUserInfo(userId);

        let allCurrentProjects = await getCurrentProjects(userId);

        for await (let eachProject of allCurrentProjects) {

            let specificProjectId = eachProject.project_id;

            let allCurrentTasks = await getCurrentTask(specificProjectId);
            let duration

            if (allCurrentTasks.length > 0) {
                for await (let eachCurrentTask of allCurrentTasks) {

                    let task_start_date = eachCurrentTask.task_start_date
                    let taskDuration = Number(eachCurrentTask.duration)

                    let taskDeadline = Number(getFinishDate(task_start_date, taskDuration));

                    duration = Number(taskDeadline - today);

                    if (duration < 0) {
                        allOverrunTasks.push(eachCurrentTask)
                    } else if (duration == 0) {
                        meetDeadlineTasks.push(eachCurrentTask)
                    } else {
                        currentTaskInfo.push(eachCurrentTask);
                    }
                }
            }
        }

        let allFinishedProjects = await getAllFinishedProjects(userId)

        res.status(200).json({
            userInfo: userInfo,
            projectInfo: allCurrentProjects,
            overrunTaskInfo: allOverrunTasks,
            meetDeadlineTaskInfo: meetDeadlineTasks,
            currentTaskInfo: currentTaskInfo,
            finishedProjects: allFinishedProjects
        })
    } catch (err) {
        serverError(err, res)
    }
}