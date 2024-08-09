import { generateImageElement } from "../../utils/generateImageElement.js";

const socket = io.connect();

var searchParams = new URLSearchParams(window.location.search);
const projectId = searchParams.get("id");

let searchInput = document.querySelector("#search");

window["addUserToProject"] = addUserToProject;

searchInput.addEventListener("input", async (e) => {
    const value = e.target.value.toLowerCase();
    let res = await fetch(`/auth/search-user?value=${value}`);
    let response = await res.json();

    let userInfoList = document.querySelector(".user-info-list");

    let userList = response.userList;

    if (userList != undefined) {
        if (res.ok) {
            userInfoList.innerHTML = "";

            for await (let user of userList) {

                let imageElm = generateImageElement(user.profile_image, user.username);

                userInfoList.innerHTML += `
                    <div class="user-info-card" id="user-info-card-${user.id}" onclick="addUserToProject(${projectId}, ${user.id}, '${user.username}')">
                        <div class="user-info-card-word")>
                            <div class="header">${user.username}</div>
                            <div class="body">${user.email}</div>
                        </div>
                        <div class="image-cropper">${imageElm}</div>
                    </div>`;
            }

        } else {
            console.log("error to be handled")
        };

    } else {
        console.log("User not found.");
    }
})

function addUserToProject(projectId, userId, username) {

    Swal.fire({
        title: `Invite ${username} to this Project??`,
        showCancelButton: true,
        confirmButtonText: "Yes",
		confirmButtonColor: "#779b9a",
        cancelButtonText: "No",
        allowOutsideClick: false
    }).then((result) => {
        if (result.isConfirmed) {
            runAddUser(projectId, userId, username);
        }
    });
}

async function runAddUser(projectId, userId, username) {

    let res = await fetch(`/projectRou/add-user`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            project_id: projectId,
            user_id: userId
        })
    })

    let response = await res.json();

    if (res.ok) {

        Swal.fire({
            title: `Adding ${username} successful`,
			confirmButtonText: "Continue",
			confirmButtonColor: "#779b9a"
        }).then((result) => {
            if (result.isConfirmed) {
                window.location.reload();
                socket.emit('addMember', { projectId: projectId, userId: userId });
            }
        });

    } else {

        if (response.error == "userAddingSelf") {
            Swal.fire({
                title: 'You cannot add yourself',
                text: 'You are in this project already',
                showConfirmButton: false,
            });

        } else if (response.error == "userAlreadyAssigned") {
            Swal.fire({
                title: `Adding ${username} failed`,
                text: 'He/She is in this project already',
                showConfirmButton: false,
            });

        } else {
            console.log(response.message);
        }
    }
}