const socket = io.connect();

import { isEmptyOrSpace, isPasswordValid } from "../../utils/checkInput.js";
import { getFinishDate } from "../utils/getFinishDate.js";
import { getCurrentDate } from "../utils/getCurrentDate.js"
import { removeChildElements } from "../../utils/removeChildElements.js";
import { changeDateFormat } from "../../utils/changeDateFormat.js";

//****************************//
// Project Creation related global variables
//****************************//

let promptCount = 1; //tracking the current prompt 
let taskCount = []; //tracking how many task information to be filled
let taskCountCurrent = 0; //tracking which task information is currently being filled

//(if a task is depend on the completion of another task)
//tracking how many sub-task information to be filled
let taskDependanceCount = [];
let motherTaskCountCurrent = 0;

let newProjectData = {
    name: "",
    start_date: "2024-01-01",
    tasks: {},
}

const projectCreationForm = document.querySelector("#projectCreationForm");
const projectCreationPromptContent = document.querySelector("#projectCreationPromptContent");
const projectCreationModalLabel = document.querySelector("#projectCreationModalLabel");
const projectCreationClose = document.querySelectorAll(".project-creation-close");

printPromptContent(promptCount)

//****************************//
// Project Creation related global variables
//****************************//

socket.on('you-have-a-new-message', projectInfo => {
    let projectId = projectInfo.projectId;
	let projectName = projectInfo.projectName;
	console.log(projectInfo)
	
	Swal.fire({
		position: "top",
		height: "500px",
		// icon: "info",
		text: `You have a new message in project ${projectName}`,
		showConfirmButton: false,
		timerProgressBar: true,
		timer: 2000
	  });
})

socket.on('i-am-in', projectInfo => {
	let projectName = projectInfo.projectName;
	
	Swal.fire({
		position: "top",
		height: "500px",
		// icon: "info",
		text: `You are added in project ${projectName}`,
		showConfirmButton: false,
		timerProgressBar: true,
		timer: 2000
	  }).then(function() {
        window.location.reload();
    });
})

var searchParams = new URLSearchParams(window.location.search);
const userId = searchParams.get("id");
// console.log("current main page user id: ", userId);

const logoutButton = document.querySelector("#logout-button");
const firstTimeConfig = document.querySelector("#first-time-config");
const updateUsername = document.querySelector("#update-username");
const editProfile = document.querySelector("#edit-profile");
const updatePassword = document.querySelector("#update-password");
const uploadProfileImage = document.querySelector("#upload-profile-image");
const uploadProjectImage = document.querySelector("#upload-project-image");

//for first config modal
const configModal = new bootstrap.Modal(document.getElementById('configModal'), {});
const configUsername = document.querySelector("#config-username");
const configFirstName = document.querySelector("#config-first-name");
const configLastName = document.querySelector('#config-last-name');
const configLocation = document.querySelector('#config-location');
const configOrganization = document.querySelector('#config-organization');

//for edit profile modal
const updateInfoModal = new bootstrap.Modal(document.getElementById('updateInfoModal'), {});
const newUsernameInput = document.querySelector("#new-username");
const newFirstName = document.querySelector("#new-first-name");
const newLastName = document.querySelector('#new-last-name');
const newLocation = document.querySelector('#new-location');
const newOrganization = document.querySelector('#new-organization');

//for identify the project id when onclick update project image button
let projectIdForImage;
window["handleProjectClick"] = handleProjectClick;

getAllUserInfo(userId)

async function getAllUserInfo(userId) {

    await socket.emit('joinUserRoom', userId);

    let res = await fetch(`/mainpage/?userId=${userId}`)
    let response = await res.json();

    let userInfo = response.userInfo;
    let projectInfo = response.projectInfo;
    let overrunTaskInfo = response.overrunTaskInfo;
    let meetDeadlineTaskInfo = response.meetDeadlineTaskInfo;
    let currentTaskInfo = response.currentTaskInfo;
    let finishedProjects = response.finishedProjects;

    let notification = document.querySelector("#notification")
    let userContent = document.querySelector(".user-content")
    let taskContent = document.querySelector(".task-content")
    let projectArea = document.querySelector(".project-area")
    let completedProjectArea = document.querySelector(".completed-project-area")

    let projectCount = 0
    let finishProjectCount = 0

    //for showing task status
    let normalTaskCount = 0;
    let priorityTaskCount = 0;
    let overrunTaskCount = 0;

    if (res.ok) {

        if (!userInfo.last_login) {
            await displayFirstLoginConfig(userInfo.username, userInfo.first_name, userInfo.last_name)
        }

        notification.innerHTML = `
            <div class="top-bar-word">Hello ${userInfo.username} !&nbsp;&nbsp; ;] &nbsp;&nbsp;&nbsp;&nbsp; Wish you a nice day!</div>`;
            projectArea.innerHTML += `<div class="box">
            <div class="create-project" data-bs-toggle="modal" data-bs-target="#projectCreationModal">
                <div class="project-name white-word">Create project</div>

                <br>

                <div class="center-image">
                    <img src="/assets/create_project.png" alt="" class="create-project-image">
                </div>

                
            </div>
        </div>`
        if (projectInfo) {
            for await (let eachProject of projectInfo) {

                let projectImageElm;
                let outerProjectId = eachProject.project_id;

                projectImageElm = eachProject.image ?
                    `<img src="/project-image/${eachProject.image}" alt="" class="project-image">` : ""

                projectArea.innerHTML += `
                   <div class="box">
                   <section class="project" id="projectId-${eachProject.project_id}" 
                    onclick="handleProjectClick(event, ${eachProject.project_id})">
                        ${projectImageElm}
                        <button type="button" class="btn btn-outline-secondary edit-project-image" data-bs-toggle="modal" data-bs-target="#uploadProjectImageModal">
                            <i class="bi bi-camera-fill"></i>
                        </button>
                        <div class="project-name white-word">${eachProject.name}</div>
                    </section>
                   </div>`

                if (Number(eachProject.min_duration) <= 10) {
                    document.querySelector(`#projectId-${eachProject.project_id}`)
                        .style.height = "300px";

                } else if (Number(eachProject.min_duration) > 10 && Number(eachProject.min_duration) <= 20) {
                    document.querySelector(`#projectId-${eachProject.project_id}`)
                    .style.height = "400px";

                } else if (Number(eachProject.min_duration) > 20 && Number(eachProject.min_duration) <= 40) {
                    document.querySelector(`#projectId-${eachProject.project_id}`)
                    .style.height = "500px";

                } else {
                    document.querySelector(`#projectId-${eachProject.project_id}`)
                    .style.height = "600px";
                }
                projectCount++
                socket.emit('joinOuterProjectRoom', outerProjectId);
            }
        }

        if (currentTaskInfo) {
            for await (let eachCurrentTask of currentTaskInfo) {
                document.querySelector(`#projectId-${eachCurrentTask.project_id}`)
                    .innerHTML += `
                        <div class="current-task white-word">Current task: ${eachCurrentTask.name}</div>
                        `

                document.querySelector(`#projectId-${eachCurrentTask.project_id}`)
                    .style.background = "#b8d3d2"

                normalTaskCount++;

            }
        }

        if (meetDeadlineTaskInfo) {
            for await (let eachDeadlineTask of meetDeadlineTaskInfo) {
                document.querySelector(`#projectId-${eachDeadlineTask.project_id}`)
                    .innerHTML += `
                        <div class="current-task deadline-task white-word">Current task: ${eachDeadlineTask.name}</div>
                        `

                document.querySelector(`#projectId-${eachDeadlineTask.project_id}`)
                    .style.background = "#e7cd77";

                priorityTaskCount++;
            }
        }

        if (overrunTaskInfo) {
            for await (let eachOverrunTask of overrunTaskInfo) {
                document.querySelector(`#projectId-${eachOverrunTask.project_id}`)
                    .innerHTML += `
                        <div class="current-task overrun-task white-word">Current task: ${eachOverrunTask.name}</div>
                        `

                document.querySelector(`#projectId-${eachOverrunTask.project_id}`)
                    .style.background = "#b4454c";

                overrunTaskCount++;
            }
        }

        if (projectInfo) {
            for await (let eachProject of projectInfo) {
                //limit to only show 5 tasks
                removeChildElements(
                    document.getElementById(`projectId-${eachProject.project_id}`),
                    7
                )
            }
        }

        if (finishedProjects) {
            for await (let eachFinishedProject of finishedProjects) {
                completedProjectArea.innerHTML += `
                    <div class="completed-project" onclick="location='/project/?id=${eachFinishedProject.project_id}'">
                    <div class="completed-project-name white-word">${eachFinishedProject.name}</div>
                    <div class="completed-project-date white-word">${eachFinishedProject.actual_finish_date}</div>
                    </div>
                    `

                finishProjectCount++
            }
        }

        //if no profile image was uploaded, use default
        let imageElm;
        if (!userInfo.profile_image) {
            let defaultProfileImage = new ProfileImage(
                userInfo.username, {
                backgroundColor: "black",
            })
            imageElm = defaultProfileImage.svg();
        } else {
            imageElm = `<img src="/profile-image/${userInfo.profile_image}" alt="" id="user-profile">`
        }

        userContent.innerHTML = `
        <div class="user-content">
            <div class="image-cropper" data-bs-toggle="modal" data-bs-target="#uploadProfileImageModal">
            ${imageElm}
            </div>
            <div class="username">${userInfo.username}</div>
            <div class="user-content-info">
            <div class="bold-text text-center">${userInfo.first_name} ${userInfo.last_name}</div>
            <div class="text-center"><i class="bi bi-envelope-at"></i> ${userInfo.email}</div>
            <div class="text-center"><i class="bi bi-geo-alt"></i> ${userInfo.location}</div>
            <div class="text-center"><i class="bi bi-building"></i> ${userInfo.organization}</div>
            </div>
        </div>`

        newUsernameInput.setAttribute("value", userInfo.username);
        newFirstName.setAttribute('value', userInfo.first_name);
        newLastName.setAttribute('value', userInfo.last_name);
        newOrganization.setAttribute('value', userInfo.organization);

        //set default location selection same as user current location
        let locationOptions = newLocation.options;
        for (let i = 0; i < locationOptions.length; i++) {
            if (userInfo.location === locationOptions[i].value) {
                locationOptions[i].selected = true;
            }
        }

        taskContent.innerHTML = `
        <div class="project-count bold-text">Current projects : ${projectCount}</div>
        <div class="bold-text">Tasks Status</div>
        <div class="task-status normal">
            <span>Normal:</span> ${normalTaskCount}
        </div>
        <div class="task-status priority">
            <span>Priority:</span> ${priorityTaskCount}
        </div>
        <div class="task-status overrun">
            <span>Overrun:</span> ${overrunTaskCount}
        </div>
        `
    }

}

//only fire button when click (not fire the section onclick)
function handleProjectClick(event, id) {
    if (event.target.classList.contains('edit-project-image') || event.target.classList.contains('bi')) {
        //will only fire modal toggle
        projectIdForImage = id;
    } else {
        const projectURL = `/project/?id=${id}`;
        window.location.href = projectURL;
    }
}

//logout button
logoutButton.addEventListener("click", (e) => {
    e.preventDefault();

    Swal.fire({
        title: "Do you want to logout",
        showCancelButton: true,
        confirmButtonColor: "#779b9a",
        confirmButtonText: "Yes",
        cancelButtonText: "No",
        allowOutsideClick: false
    }).then((result) => {
        if (result.isConfirmed) {
            runLogout();
        }
    });

})

async function runLogout() {
    let res = await fetch("/auth/logout", {
        method: "POST"
    })

    if (res.ok) {
        window.location.href = '/';
    }
}

//for newly registered user
async function displayFirstLoginConfig(username, firstName, lastName) {

    if (username.endsWith('@')) {
        //identified as a google login
        username = username.slice(0, -1);

        //update username without @
        //backend already check if same username exists
        await fetch("/auth/username-update", {
            method: "PUT",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ username })
        });

        configFirstName.setAttribute('value', firstName);
        configLastName.setAttribute('value', lastName);
    }
    configUsername.setAttribute('value', username);

    configModal.show();
}

firstTimeConfig.addEventListener("submit", async (e) => {
    e.preventDefault();

    const firstName = configFirstName.value;
    const lastName = configLastName.value;
    const location = configLocation.value;
    const organization = configOrganization.value;

    await runProfileUpdate(firstName, lastName, location, organization, firstTimeConfig);
    
    let res = await fetch ('/auth/update-log-time', {
        method: "PUT"
    })

    let result = await res.json();

    if (res.ok) {
        getAllUserInfo(userId)
        configModal.hide();
    } else {
        console.log(result)
    }
})

//update username submit button
updateUsername.addEventListener("submit", async (e) => {
    e.preventDefault();

    const username = newUsernameInput.value;

    let userInfoRes = await fetch('/auth/user')
    let currentUserInfo = await userInfoRes.json();

    if (isEmptyOrSpace(username)) {
        Swal.fire({
            title: 'Username cannot be blank or only space',
            showConfirmButton: false
        });

    } else if (username === currentUserInfo.data.username) {
        Swal.fire({
            title: 'Username unchanged!',
            confirmButtonText: "Pick another username"
        });

    } else {
        let res = await fetch("/auth/username-update", {
            method: "PUT",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ username })
        });

        let result = await res.json();

        if (res.ok) {
            Swal.fire({
                title: 'Username update successful!',
                confirmButtonColor: "#779b9a",
                confirmButtonText: "Continue"
            }).then((result) => {
                if (result.isConfirmed) {
                    window.location.reload();
                    getAllUserInfo(userId)
                }
            });

        } else {
            if (result.error == "newUsernameExist") {
                Swal.fire({
                    title: 'Username already taken!',
                    confirmButtonColor: "#779b9a",
                    confirmButtonText: "Pick another name"
                });
            }
        }
    }
})

//edit user info submit button
editProfile.addEventListener("submit", async (e) => {
    e.preventDefault();

    const firstName = newFirstName.value;
    const lastName = newLastName.value;
    const location = newLocation.value;
    const organization = newOrganization.value;

    await runProfileUpdate(firstName, lastName, location, organization, editProfile);

    getAllUserInfo(userId)
    updateInfoModal.hide();
})

//same for edit profile and first time config
async function runProfileUpdate(firstName, lastName, location, organization, formSelector) {

    if (isEmptyOrSpace(firstName) || isEmptyOrSpace(lastName) || isEmptyOrSpace(location) || isEmptyOrSpace(organization)) {
        Swal.fire({
            title: 'Inputs cannot be blank or only space',
            showConfirmButton: false
        });

        formSelector.reset();

    } else {
        let res = await fetch("/auth/user-profile-update", {
            method: "PUT",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ firstName, lastName, location, organization })
        });

        let result = await res.json();

        if (res.ok) {

            Swal.fire({
                title: 'User profile update successful!',
                confirmButtonColor: "#779b9a",
                confirmButtonText: "Continue"
            }).then((result) => {
                if (result.isConfirmed) {
                    return;
                }
            });

        } else {
            console.log(result.error);
        }
    }
}

//update password button
updatePassword.addEventListener("submit", async (e) => {
    e.preventDefault();

    //check if both passwords are the same
    const password = document.querySelector("#password1").value;
    const passwordConfirm = document.querySelector("#password2").value;

    if (passwordConfirm != password) {

        Swal.fire({
            title: 'Invalid password input',
            text: 'Please re-enter the same password you entered',
            showConfirmButton: false,
        });

    } else {

        if (!isPasswordValid(password)) {

            Swal.fire({
                title: 'Invalid password input',
                text: 'Password must be as least 10 characters long, and a combination of uppercase letters, lowercase letters, numbers and symbol',
                showConfirmButton: false,
            });

        } else {

            let res = await fetch("/auth/password-update", {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({ password })
            });

            let result = await res.json();

            if (res.ok) {

                console.log(result);

            } else {
                if (result.error == "sameAsCurrentPassword") {

                    Swal.fire({
                        title: 'Password unchanged',
                        text: 'New password is same as current password',
                        showConfirmButton: false,
                    });

                } else {
                    console.log(result.error);
                }
            }
        }
    }
})

document.querySelector("#toggle-password").addEventListener("click", (e) => {
    showPassword();
})

//show password toggle
function showPassword () {
    let password1 = document.querySelector("#password1");
    let password2 = document.querySelector("#password2");

    if (password1.type === 'password' && password2.type === 'password') {
        password1.type = 'text';
        password2.type = 'text';
    } else if (password1.type === 'text' && password2.type === 'text') {
        password1.type = 'password';
        password2.type = 'password';
    };
}

//upload profile image
//conditions to be handled
uploadProfileImage.addEventListener("submit", async (e) => {
    e.preventDefault();

    const formData = new FormData(e.currentTarget);

    const res = await fetch("/auth/profile-image-update", {
        method: "POST",
        body: formData,
    });

    let response = await res.json();

    if (res.ok) {

        Swal.fire({
            title: 'Profile Image Uploaded',
            confirmButtonColor: "#779b9a",
            confirmButtonText: "Continue"
        }).then((result) => {
            if (result.isConfirmed) {
                window.location.reload();
                getAllUserInfo(userId)
            }
        });

    } else {
        //not able to catch error from backend??
        //status 400 conditions to be handled
        console.log(response);
    }
})

//update project profile picture
//conditions to be handled
uploadProjectImage.addEventListener("submit", async (e) => {
    e.preventDefault();

    const formData = new FormData(e.currentTarget);

    formData.append('id', projectIdForImage);

    const res = await fetch("/projectRou", {
        method: "PUT",
        body: formData,
    });

    let response = await res.json();

    if (res.ok) {

        Swal.fire({
            title: 'Project Image Uploaded',
            confirmButtonColor: "#779b9a",
            confirmButtonText: "Continue"
        }).then((result) => {
            if (result.isConfirmed) {
                window.location.reload();
                getAllUserInfo(userId)
            }
        });
    } else {
        //not able to catch error from backend??
        //status 400 conditions to be handled
        console.log(response);
    }
})

projectCreationClose.forEach(elm => {
    elm.addEventListener("click", (e) => {

        e.preventDefault();

        if (promptCount == 1) {
            $("#projectCreationModal").modal("hide");
            window.location.reload();

        } else if (promptCount > 1) {
            Swal.fire({
                title: "All your progress will be cleared!",
                text: "Are you sure?",
                showConfirmButton: false,
                showDenyButton: true,
                cancelButtonColor: "#779b9a",
                showCancelButton: true,
                denyButtonText: `Close and Reset`,
                cancelButtonText: `Continue`

            }).then((result) => {
                if (result.isDenied) {
                    resetProgress();
                    $("#projectCreationModal").modal("hide");
                    //not able to reset modal content??
                    //using window reload (better solution)
                    window.location.reload();
                }
            });
        }
    })
})

projectCreationForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    //ready to init
    if (promptCount == 99) {

        let projId = await projectInit(newProjectData);

        Swal.fire({
            title: 'Creating Project Successful',
            text: `Redirecting to your project page`,
            showConfirmButton: false,
            timer: 1800,
            timerProgressBar: true,
            didOpen: () => {
                Swal.showLoading();
            }
        }).then((result) => {
            if (result.dismiss === Swal.DismissReason.timer) {
                window.location.reload();
                window.location.href = `../project/?id=${projId}`
            };
        })

    } else {

        let inputTarget = e.currentTarget;
        //save response and update prompt count
        promptCount = saveResponseByPromptCount(promptCount, inputTarget);

        // try {
        //     console.log(`current Q: ${promptCount}`);
        //     console.log(`taskCount: ${taskCount}`)
        //     console.log(`taskDependanceCount: ${taskDependanceCount}`)
        //     console.log(`taskCountCurrent: ${taskCountCurrent}`)
        //     console.log(`motherTaskCountCurrent: ${motherTaskCountCurrent}`)
        // } catch (error) {
        //     console.log(error);
        // }

        //change inner html content to next prompt
        projectCreationModalLabel.innerHTML = `Creating Project: <span class="names">"${newProjectData.name}"</span>`;
        projectCreationPromptContent.innerHTML = printPromptContent(promptCount);
    }
})

function saveResponseByPromptCount(count, inputTarget) {

    if (count == 1) {
        newProjectData.name = inputTarget.response.value;
        return 2;

    } else if (count == 2) {
        newProjectData.start_date = inputTarget.response.value;
        return 3;

    } else if (count == 3) {

        for (let i = 1; i <= inputTarget.response.value; i++) {

            newProjectData.tasks[i] = {
                name: "",
                start_date: "2024-01-01",
                duration: 0,
                finish_date: "2024-12-31",
                pre_req_of: [],
            };

            taskCount.push(i);
        }
        return 4;

    } else if (count == 4) {
        for (let i = 1; i <= taskCount.length; i++) {
            newProjectData.tasks[i].name = inputTarget[("response_" + i)].value;
        }

        return 5;

    } else if (count == 5) {
        if (!inputTarget.response) {
            newProjectData.tasks[taskCountCurrent].start_date = newProjectData.start_date;
        } else {
            newProjectData.tasks[taskCountCurrent].start_date = inputTarget.response.value;
        }

        return 6;

    } else if (count == 6) {
        newProjectData.tasks[taskCountCurrent].duration = parseInt(inputTarget.response.value);

        let finishDate = getFinishDate(
            newProjectData.tasks[taskCountCurrent].start_date,
            newProjectData.tasks[taskCountCurrent].duration
        );

        newProjectData.tasks[taskCountCurrent].finish_date = finishDate;

        if (taskCount.length == 0) {
            //if there is no more task to fill
            return 99;

        } else if (taskDependanceCount.length > 0) {
            //to finish all other sub-task
            taskCountCurrent = taskDependanceCount[0];
            return 5;

        } else if (motherTaskCountCurrent == 0 || newProjectData.tasks[motherTaskCountCurrent].pre_req_of.length === 0) {
            return 7;
        } else {
            taskDependanceCount = [...newProjectData.tasks[motherTaskCountCurrent].pre_req_of];
            taskCountCurrent = taskDependanceCount[0];
            motherTaskCountCurrent = 0;
            return 7;
        }

    } else if (count == 7) {

        taskDependanceCount.length = 0;

        if (inputTarget.response.value == 0) {
            //if user choose no, repeat Q5 to Q7
            return 5;
        } else {
            //if user choose yes
            motherTaskCountCurrent = taskCountCurrent
            return 8;
        };

    } else if (count == 8) {
        const checkboxes = document.querySelectorAll('input[type="checkbox"]');

        //to be handled: user must check as least one box

        for (let checkbox of checkboxes) {
            if (checkbox.checked) {
                let taskNum = parseInt(checkbox.value);
                newProjectData.tasks[taskCountCurrent].pre_req_of.push(taskNum);
                taskDependanceCount.push(taskNum);
            }
        }

        taskCountCurrent = taskDependanceCount[0];

        //handling: no need to get info from same task if go to Q5 again
        for (let task of taskDependanceCount) {
            if (taskCount.includes(task)) {
                let indexToRemove = taskCount.indexOf(task);
                taskCount.splice(indexToRemove, 1);
            }
        }
        return 5;

    }
}

function printPromptContent(promptCount) {
    if (promptCount == 1) {
        return `
        <label for="projectCreationResponse" class="form-label">
        What is the title of your Project??
        </label>

        <div class="input-group mb-3">
        <span class="input-group-text">Project Title</span>
        <input class="form-control" id="projectCreationResponse" type="text" name="response" value="New Project 1">
        </div>`;

    } else if (promptCount == 2) {
        return `
        <label for="projectCreationResponse" class="form-label">
        What is your Project Starting Date??
        </label>

        <div class="input-group mb-3">
        <span class="input-group-text">Starting Date</span>
        <input class="form-control" id="projectCreationResponse" type="date" value="${getCurrentDate()}" min="1997-07-01" max="2046-06-30" name="response">
        </div>`;

    } else if (promptCount == 3) {
        return `
        <label for="projectCreationResponse" class="form-label">
        How many Tasks do you plan to have for this Project??
        <br/><mark>Let's start with 2 to 5 Tasks.</mark> You may remove or add more later.
        </label>

        <div class="input-group mb-3">
        <span class="input-group-text">Number of Tasks</span>
        <input class="form-control" id="projectCreationResponse" type="number" min="2" max="5" value="2" name="response">
        </div>`;

    } else if (promptCount == 4) {
        return `
        <label for="projectCreationResponse" class="form-label">
        What are the title of the Task(s)??
        </label>
        ${printTaskNameInput()}`;

    } else if (promptCount == 5) {

        if (taskDependanceCount.length > 0) {
            //to check if currently working on sub-tasks
            taskDependanceCount.shift();

            let minStartDate = getFinishDate(newProjectData.tasks[motherTaskCountCurrent].finish_date, 1);

            return `
            <label for="projectCreationResponse" class="form-label">
            When will Task #${taskCountCurrent} start??
            <br/>Let's assume to be one day after
            <br/><mark>${changeDateFormat(newProjectData.tasks[motherTaskCountCurrent].finish_date)}
            <br/>(Completion date of Task #${motherTaskCountCurrent})</mark>
            <br/>
            </label>

            <div class="input-group mb-3">
            <span class="input-group-text">Task #${taskCountCurrent}</span>
            <input class="form-control" id="projectCreationResponse" type="text" value="${newProjectData.tasks[taskCountCurrent].name}" disabled>
            </div>

            <div class="input-group mb-3">
            <span class="input-group-text">Starting Date</span>
            <input class="form-control" id="projectCreationResponse" type="date" value="${minStartDate}" min="${minStartDate}" max="2046-06-30" name="response">
            </div>`;
        }

        //check if all task information have been input
        if (taskCount.length == 0) {
            //never fire???
            return `
            <label for="projectCreationResponse" class="form-label">
            Done!!
            </label>
            `

        } else {
            //update the current task number for input
            taskCountCurrent = taskCount.shift();

            if (taskCountCurrent == 1) {
                //Q5a only for task 1 (first task)
                return `
                <label for="projectCreationResponse" class="form-label">
                Let's assume the start date of Task #${taskCountCurrent} 
                <br/>to be same as Project start date.
                <br/>

                <div class="input-group mb-3">
                <span class="input-group-text">Task #${taskCountCurrent}</span>
                <input class="form-control" id="projectCreationResponse" type="text" value="${newProjectData.tasks[taskCountCurrent].name}" disabled>
                </div>

                <div class="input-group mb-3">
                <span class="input-group-text">Task #${taskCountCurrent} Starting Date</span>
                <input class="form-control" id="projectCreationResponse" type="date" value="${newProjectData.start_date}" min="${newProjectData.start_date}" max="2046-06-30" name="response" disabled>
                </div>`;

            } else {
                //Q5b for tasks other than first task
                return `
                <label for="projectCreationResponse" class="form-label">
                When will Task #${taskCountCurrent} start??
                </label>

                <div class="input-group mb-3">
                <span class="input-group-text">Task #${taskCountCurrent}</span>
                <input class="form-control" id="projectCreationResponse" type="text" value="${newProjectData.tasks[taskCountCurrent].name}" disabled>
                </div>

                <div class="input-group mb-3">
                <span class="input-group-text">Starting Date</span>
                <input class="form-control" id="projectCreationResponse" type="date" value="${getCurrentDate()}" min="1997-07-01" max="2046-06-30" name="response">
                </div>`;
            }
        }

    } else if (promptCount == 6) {
        return `
        <label for="projectCreationResponse" class="form-label">
        How many working days will it take to complete Task ${taskCountCurrent}</span>??
        </label>

        <div class="input-group mb-3">
        <span class="input-group-text">Task #${taskCountCurrent}</span>
        <input class="form-control" id="projectCreationResponse" type="text" value="${newProjectData.tasks[taskCountCurrent].name}" disabled>
        </div>

        <div class="input-group mb-3">
        <span class="input-group-text">Days to Complete</span>
        <input class="form-control" id="projectCreationResponse" type="number" min="1" max="10" value="1" name="response">
        </div>`;

    } else if (promptCount == 7) {

        return `
        <div class="input-group mb-3">
        <span class="input-group-text">Task #${taskCountCurrent}</span>
        <input class="form-control" id="projectCreationResponse" type="text" value="${newProjectData.tasks[taskCountCurrent].name}" disabled>
        </div>

        <div class="input-group mb-3">
        <span class="input-group-text">Completion Date</span>
        <input class="form-control" id="projectCreationResponse" type="date" value="${newProjectData.tasks[taskCountCurrent].finish_date}" disabled>
        </div>

        <label for="projectCreationResponse" class="form-label">
        The estimated completion date of Task ${taskCountCurrent} is ${changeDateFormat(newProjectData.tasks[taskCountCurrent].finish_date)}.
        <br/><mark>Must this Task be completed prior to starting any other Tasks??</mark>
        </label>

        <div class="form-check">
        <input class="form-check-input" type="radio" name="response" id="projectCreationResponseYes" value="1">
        <label class="form-check-label" for="projectCreationResponseYes">
        Yes
        </label></div>

        <div class="form-check">
        <input class="form-check-input" type="radio" name="response" id="projectCreationResponseNo" value="0" checked>
        <label class="form-check-label" for="projectCreationResponseNo">
        No
        </label></div>`;

    } else if (promptCount == 8) {
        return `
        <label for="projectCreationResponse" class="form-label">
        Which Task(s) can only be started after
        <br/>Task ${taskCountCurrent}: "${newProjectData.tasks[taskCountCurrent].name}"??
        <br/>
        </label>
        ${printTaskNameCheckboxes()}
        `
    } else if (promptCount == 99) {
        return `
        <label for="projectCreationResponse" class="form-label">
        Done!!
        Hit Next to finalize your Project!
        </label>
        `
    }
}

function printTaskNameInput() {
    let printResult = "";
    for (let i = 1; i <= taskCount.length; i++) {
        printResult += `
        <div class="input-group mb-3">
        <span class="input-group-text">Task #${i}</span>
        <input class="form-control" id="projectCreationResponse" type="text" name="response_${i}" value="New Task ${i}">
        </div>`;
    };
    return printResult;
}

function printTaskNameCheckboxes() {
    let printResult = "";
    for (let i = 0; i < (taskCount.length); i++) {
        let taskNum = taskCount[i];
        printResult += `
        <div class="form-check">
        <input class="form-check-input" type="checkbox" value="${taskNum}" id="projectCreationResponseCheckboxTask_${taskNum}">
        <label class="form-check-label" for="projectCreationResponseCheckboxTask_${taskNum}">
        Task ${taskNum}: <mark>"${newProjectData.tasks[taskNum].name}"</mark>
        </label>
        </div>`
    };
    return printResult;
}

async function projectInit(projJSON) {
    addPreReq(projJSON);

    const res = await fetch("/projectRou/init", {
        method: "POST",
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(projJSON),
    });

    let result = await res.json()

    return result.data.id;
}

function addPreReq(projJSON) {
    //add pre_req key to tasks.task
    for (let taskId in projJSON.tasks) {
        projJSON.tasks[taskId]["pre_req"] = [];
    }

    for (let taskId in projJSON.tasks) {
        for (let subTaskId of projJSON.tasks[taskId].pre_req_of) {
            if (subTaskId) {
                projJSON.tasks[subTaskId].pre_req.push(parseInt(taskId));
            }
        }
    }
};

function resetProgress() {
    promptCount = 1;
    taskCount = [];
    taskCountCurrent = 0
    taskDependanceCount = [];
    motherTaskCountCurrent = 0;

    printPromptContent(promptCount);

    // try {
    //     console.log(`current Q: ${promptCount}`);
    //     console.log(`taskCount: ${taskCount}`)
    //     console.log(`taskDependanceCount: ${taskDependanceCount}`)
    //     console.log(`taskCountCurrent: ${taskCountCurrent}`)
    //     console.log(`motherTaskCountCurrent: ${motherTaskCountCurrent}`)
    // } catch (error) {
    //     console.log(error);
    // }
}