
import { pgClient } from "./pgClient";

export async function getMinDuration(taskId: string) {
    let treeResult = await getChildTree({}, taskId)
    let routeResult = getRoutes(treeResult, taskId) 

    let result = await shortestRoute(routeResult)

    
    return result
}



async function getChildTree(childTree: any = {}, taskId: string) {
    const postTasks = (await pgClient.query(`select task_id from task_relation where pre_req_task_id = $1 group by task_id`, [taskId])).rows


    if (postTasks.length == 0) {
        return
    }

    for (let task of postTasks) {
        if (!childTree.hasOwnProperty(taskId)) {
            childTree[taskId] = []
        }
        if (!childTree.hasOwnProperty(task.task_id)) {
            childTree[task.task_id] = []
        }
        if (!childTree[taskId].includes(task.task_id)) {
            childTree[taskId].push(task.task_id)
            await getChildTree(childTree, task.task_id)
        }
    }

    return childTree;
}




function findRoutes(childTree: any, taskId: string, path: string[], routes: string[][]): string[][] {
    path.push(taskId)
    if (!childTree[taskId]) {
        routes.push(path.slice())
        path.pop()
        return routes
    }
    routes.push(path.slice())
    for (let child of childTree[taskId]) {
        findRoutes(childTree, child, path, routes)
    }
    path.pop()
    return routes
}

function getRoutes(childTree: any, rootTask: string): string[][] {
    let routes: string[][] = []
    findRoutes(childTree, rootTask, [], routes)
    return routes
}

async function shortestRoute(routes: string[][]) {
    let routeDuration: any = await switchTaskIntoDuration(routes)
    routeDuration = toNumberArray(routeDuration)
    routeDuration = sumArrays(routeDuration)
    let result = Math.max(...routeDuration)
    return result

}


async function switchTaskIntoDuration(routes: string[][]) {
    let duration: string[][] = []
    for (let path of routes) {
        let temp = []
        for (let i = 0; i < path.length; i++) {
            let task = (await pgClient.query(`select duration from tasks where id = $1`, [path[i]])).rows[0].duration
            temp.push(task)
            if (i == path.length - 1) {
                duration.push(temp)
            }
        }
    }
    return duration
}

function toNumberArray(stringArray: string[][]): number[][] {
    return stringArray.map((array: string[]) => array.map((string: string) => Number(string)))
}

function sumArrays(numberArray: number[][]): number[] {
    return numberArray.map((array: number[]) => array.reduce((sum: number, current: number) => sum + current, 0))
}


