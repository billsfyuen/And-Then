//Outdated for reference only

Project Creation Wizard

We will guide you through the process of setting up a new project and breaking it down into smaller, manageable tasks.

Step 1: Project Details
1. What is the name of your project?
2. When will your project start? (Enter the start date in the format YYYY-MM-DD)

Step 2: Task Planning
3. How many tasks do you plan to have for this project? (Please enter a number between 2 and 5)

Great, let's define the tasks for your project.

4. 
What is the title of Task 1?
What is the title of Task 2?
What is the title of Task 3? (Optional, only if you selected 3 or more tasks)
What is the title of Task 4? (Optional, only if you selected 4 or more tasks)
What is the title of Task 5? (Optional, only if you selected 5 tasks)

5. 
Step 3: Task Details
When will Task 1 start? (This will be the same as the project start date)

6. 
How many working days will it take to complete Task 1?

7. 
Does Task 1 need to be completed before any other tasks can start? (Yes/No)

If you answered "No" to the previous question:
5. (Q5.1) When will Task 2 start? (Enter the start date in the format YYYY-MM-DD)
6. How many working days will it take to complete Task 2?
7. Does Task 2 need to be completed before any other tasks can start? (Yes/No)

Repeat steps 5-7 for each remaining task.

If you answered "Yes" to the previous question:
8. Which task(s) can only be started after the completion of Task 1? (Enter the task number(s))
9. (Q5.2) 
When will Task 2 start? (Enter the start date in the format YYYY-MM-DD)
can only be start one day after the completion of Task 1?

If you answered "No" to the previous question:
10. 

Repeat steps 15-17 for each remaining task that has a dependency on the previous task.

Final
18. Your project, "${project_name}", is scheduled to start on ${project_start_date} and is initially estimated to be completed on ${estimated_completion_date}.


--------------

output format sample

{
    "name": "New Project 1",
    "start_date": "2024-01-01",
    "tasks": {
        "1": {
            "name": "New Task 1",
            "start_date": "2024-01-01",
            "duration": 1,
            "finish_date": "2024-01-02",
            "pre_req_of": [
                2,
                3
            ],
            "pre_req": []
        },
        "2": {
            "name": "New Task 2",
            "start_date": "2024-01-03",
            "duration": 1,
            "finish_date": "2024-01-04",
            "pre_req_of": [
                4
            ],
            "pre_req": [
                1
            ]
        },
        "3": {
            "name": "New Task 3",
            "start_date": "2024-01-03",
            "duration": 1,
            "finish_date": "2024-01-04",
            "pre_req_of": [],
            "pre_req": [
                1
            ]
        },
        "4": {
            "name": "New Task 4",
            "start_date": "2024-01-05",
            "duration": 1,
            "finish_date": "2024-01-06",
            "pre_req_of": [
                5
            ],
            "pre_req": [
                2
            ]
        },
        "5": {
            "name": "New Task 5",
            "start_date": "2024-01-07",
            "duration": 1,
            "finish_date": "2024-01-08",
            "pre_req_of": [],
            "pre_req": [
                4
            ]
        }
    }
}