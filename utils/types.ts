export type projectType = {
    projectName:string,
    photo?:string,
    minimumDuration?:number
    tasks?:taskType[]
}

export type taskType = {
    info:string,
        deadline:string,
        startDate:string,
        finishDate:string,
        preReqTask?:string|number[],
        comment?:string,
}