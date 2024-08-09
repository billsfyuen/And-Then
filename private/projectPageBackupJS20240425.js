const socket = io.connect();

import { getFinishDate } from "../../utils/getFinishDate.js";

var searchParams = new URLSearchParams(window.location.search);
const projectId = searchParams.get("id");

async function getProjectData(id) {
	const res = await fetch(`/projectRou/?id=${id}`)
	const data = (await res.json()).data
	console.log(data);
	return data
}


window.addEventListener("load", async (e) => {
	try {
		const data = await getProjectData(projectId)
		displayMember(data)
		await drawPage(projectId)
		const finishbtns = document.querySelectorAll(".finish-btn")
		finishbtns.forEach((btn) => {
			btn.addEventListener("click", async (e) => {

				let taskId = (e.currentTarget.parentElement.parentElement.parentElement.id).slice(5)
				
				await fetch('/task/finish', {
					method: "PUT",
					headers: {
						"Content-Type": "application/json"
					},
					body: JSON.stringify({ id: taskId })
				})
				if (res.ok) {
					await drawPage()
				}
			})
		})





		const assignBtns = document.querySelectorAll(".assign-btn")
		assignBtns.forEach((btn) => {
			btn.addEventListener("click", async (e) => {
				let taskId = (e.currentTarget.parentElement.parentElement.parentElement.id).slice(5)
				console.log('gggggg',e.currentTarget.parentElement.parentElement.parentElement)
				console.log(taskId);
				await assignTask(taskId)
			})
		})
	} catch (error) {
		console.log(error);
	}
})


gantt.attachEvent("onAfterTaskDelete", async (id, item) => {
	try {
		const taskdata = (await getProjectData(projectId)).tasks
		const taskid = taskdata[id - 1].id
		if (taskid) {
			let res = await fetch('/task', {
				method: "DELETE",
				headers: {
					"Content-Type": "application/json"
				},
				body: JSON.stringify({
					taskId: taskid
				})
			})
			let message = (await res.json()).message
			console.log(message);
		}
	} catch (error) {
		console.log(error)
	}

});

gantt.attachEvent("onAfterTaskAdd", async function (id, item) {
	const req = {
		projectId: parseInt(projectId),
		taskName: item.text,
		startDate: getFinishDate(item.start_date, 1),
		duration: item.duration
	}
	console.log(req);
	const res = await fetch("/task", {
		method: "POST",
		headers: {
			'Content-Type': 'application/json',
		},
		body: JSON.stringify(req),
	});
});

gantt.attachEvent("onAfterTaskUpdate", async function (id, item) {
	const taskdata = (await getProjectData(projectId)).tasks
	const taskid = taskdata[id - 1].id

	console.log(taskid);
	const req = {
		projectId: projectId,
		taskId: taskid,
		taskName: item.text,
		duration: item.duration,
		startDate: getFinishDate(item.start_date, 1),
		finishDate: item.progress == 1 ? "finished" : null
	}
	let res = await fetch('/task', {
		method: "PUT",
		headers: {
			"Content-Type": "application/json"
		},
		body: JSON.stringify(req)
	})
});

gantt.attachEvent("onAfterLinkDelete", async function (id, item) {
	const tasksData = (await getProjectData(projectId)).tasks
	const preTask = tasksData[item.source - 1];
	const task = tasksData[item.target - 1];
	const req = {
		projectId:projectId,
		preTask: preTask.id,
		taskId: task.id
	}
	let res = await fetch('/task/relation', {
		method: "DELETE",
		headers: {
			"Content-Type": "application/json"
		},
		body: JSON.stringify(req)
	})
	
});

gantt.attachEvent("onAfterLinkAdd", async function (id, item) {
	const tasksData = (await getProjectData(projectId)).tasks
	const preTask = tasksData[item.source - 1]
	const task = tasksData[item.target - 1];
	const req = {
		projectId: projectId,
		preTask: preTask.id,
		taskId: task.id
	}

	let res = await fetch('/task/relation', {
		method: "POST",
		headers: {
			"Content-Type": "application/json"
		},
		body: JSON.stringify(req)
	})
});


function chartData(data) {
	let projectData = [{ id: 1, text: data.name, start_date: data.start_date, duration: data.min_duration, parent: 0, open: true }]

	for (let i = 1; i < data.tasks.length; i++) {
		let taskData = data.tasks
		let temp = {}
		temp.id = i + 1
		temp.text = taskData[i].name
		temp.start_date = taskData[i].start_date
		temp.duration = parseInt(taskData[i].duration)
		if (taskData[i].actual_finish_date) {
			temp.progress = 1
		}
		projectData.push(temp)
	}
	return projectData
}

function chartRelation(data) {
	let taskRelation = []
	let idCount = 1
	const rootTaskId = data.tasks[0].id
	for (let i = 2; i < data.tasks.length; i++) {
		let relation = data.tasks[i].relation.preTask
		if (relation.length > 0) {
			for (let j = 0; j < relation.length; j++) {
				if (relation[j] == rootTaskId) {
					continue
				}
				let temp = {}
				temp.id = idCount
				temp.source = relation[j] - rootTaskId + 1
				temp.target = i + 1
				temp.type = "0"
				taskRelation.push(temp)
				idCount += 1
			}
		}
	} return taskRelation
}

function createGanttChart(data) {
	const projectData = chartData(data)
	const taskRelation = chartRelation(data)
	gantt.config.date_format = "%Y-%m-%d";
	gantt.init("gantt_here");

	gantt.parse({
		data: projectData,
		links: taskRelation
	});
	gantt.getTask(1).readonly = true;
}

async function displayTaskList(data) {
	const tasks = data.tasks
	const res = await fetch("/auth/user")
	const userId = (await res.json()).data.id

	for (let task of tasks) {
		let imageElm = "";

		if (task.userRelation[0]) {
			if (!(task.userRelation[0].profile_image)) {
				let defaultProfileImage = new ProfileImage(
					task.userRelation[0].username, {
					backgroundColor: "black",
				})
				imageElm = defaultProfileImage.svg();
			} else {
				imageElm = `<img src="/profile-image/${task.userRelation[0].profile_image}" alt="" id="user-profile">`
			}
		}



		if ((task.name).includes("root")) {
			continue
		}
		
		if (task.actual_finish_date) {
			document.querySelector(".inside-jira-task-box-finished").innerHTML += `
            
				<div class="inside-jira-task white-word" id="task_${task.id}">
					<div class="task-name" id="${task.id}">
						<span class="image-cropper">${task.userRelation[0] ? imageElm : ""}</span>
						${task.name}
					</div>
					<div class="task-any-fucking-icon"></div>
				</div>
			
			`

		} else if (task.pre_req_fulfilled) { 

			document.querySelector(".inside-jira-task-box-ongoing").innerHTML += `
			
				<div class="inside-jira-task white-word" id="task_${task.id}">

					<div class="task-name">
						<span class="image-cropper">${task.userRelation[0] ? imageElm : ""}</span>
						${task.name}
					</div>


					<div class="task-name">${task.name}</div>

					<div class="task-any-fucking-icon">
						<div class="btn-container">
							<button class="assign-btn"><i class="fa-solid fa-plus"></i></button>
                			${task.userRelation[0] ? (userId == task.userRelation[0].userid ? '<button class="finish-btn"><i class="fa-solid fa-check"></i></button>' : "") : ''}
						</div>
					</div>
				</div>
			`

		} else {
			document.querySelector(".inside-jira-task-box-to-do-list").innerHTML += `
			
				<div class="inside-jira-task white-word" id="task_${task.id}">
					<div class="task-name">
						<span class="image-cropper">${task.userRelation[0] ? imageElm : ""}</span>
						${task.name}
					</div>
					<div class="task-any-fucking-icon">
						<div class="btn-container">
							<button class="assign-btn"><i class="fa-solid fa-plus"></i></button>
						</div>
					</div>
				</div>
			
			`
		}
	}
}

async function drawPage(projectId) {
	const data = await getProjectData(projectId)
	createGanttChart(data)
	await displayTaskList(data)
}

async function assignTask(taskId) {

	const data = await getProjectData(projectId)
	const userList = data.users
	const inputOption = {}
	for (let user of userList) {
		inputOption[user.id] = user.username
	}
	const { value: person } = await Swal.fire({
		title: "Select Person",
		input: "select",
		inputOptions: inputOption,
		inputPlaceholder: "Select person",
		showCancelButton: true,
		inputValidator: (value) => {
			return new Promise((resolve) => {
				if (value) {
					resolve();
				} else {
					resolve("You need to choose a person");
				}
			});
		}
	}).then(async (result) => {

		try {
			const userId = result.value
			const res = await fetch("/task/userTaskRelation", {
				method: "POST",
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({ taskId: taskId, userId: userId, projectId: projectId }),
			});
			if (res.ok) {
				console.log("HAHA");
			}
		} catch (error) {
			console.log(error);
		}

	});
}



document.querySelector(".add-teammate").addEventListener("click", (e) => {

})
document.querySelector(".remove-teammate").addEventListener("click", (e) => {

})
document.querySelector(".quit-team").addEventListener("click", async (e) => {
	const res = await fetch("/projectRou/remove-user", {
		method: "DELETE",
		headers: {
			'Content-Type': 'application/json',
		},
		body: JSON.stringify({ projectId: projectId }),
	});
	const data = await res.json()
	console.log(data.id);
	if (res.ok) {
		console.log("yeah");
		window.location.href = `../main/?id=${data.id}`
	}
})

const mainPage = document.querySelector(".main-page").addEventListener("click", async (e) => {
	const res = await fetch("/auth/user")
	const data = (await res.json()).data
	window.location.href = `../main/?id=${data.id}`
})









document.querySelector(".open-chatroom").addEventListener("click", async (e) => {
	e.preventDefault()

	let darkenArea = document.querySelector(".darken-area")
	darkenArea.style.display = "block";

	let chatroomBox = document.querySelector(".chatroom-box")
	chatroomBox.style.display = "block";

	await getAllMessages(projectId);
	// console.log("projectId: ", projectId)
})

//===================== Get All Members And Messages Below ====================

window["editMessage"] = editMessage;
window["confirmEdit"] = confirmEdit;
window["getOtherUserInfo"] = getOtherUserInfo;
window["sendMessage"] = sendMessage;
async function getAllMessages(projectId) {

	let res = await fetch(`/chatroom?projectId=${projectId}`)

	let response = await res.json();

	let allMessagesDate = response.allMessagesDate;
	let allMessages = response.allMessages;
	let allMembers = response.groupMembers;
	let edited

	if (res.ok) {

		let memberList = document.querySelector("#member-list")

		for (let eachMember of allMembers) {
			memberList.innerHTML +=
				`
            <div class="member">
            <div class="username" onclick="getOtherUserInfo(${eachMember.user_id})">${eachMember.username}</div>
            <div class="image-cropper" onclick="getOtherUserInfo(${eachMember.user_id})">
            ${eachMember.profile_image ? `<img src="/profile-image/${eachMember.profile_image}" class="profilePic" />` :
					`<img src="01.jpg" class="profilePic" />`}
            </div>
            </div>
            `
		}


		// onclick="async() => {await editMessage(${eachMessage.messages_id},'${eachMessage.content}') } "


		let messagesBox = document.querySelector("#message-box")
		// console.log(allMessages);

		for (let eachMessageDate of allMessagesDate) {
			// messagesBox.innerHTML += "<div>123"
			messagesBox.innerHTML +=
				`<div class="displayCreatedDate"><div>${eachMessageDate.created_date}</div></div>`

			for (let eachMessage of allMessages) {
				edited = eachMessage.edited_at;
				if (eachMessage.created_date == eachMessageDate.created_date) {

					messagesBox.innerHTML +=
						`
                ${response.userId == eachMessage.users_id ?
							`
                <div class="myMessage" id="msgId-${eachMessage.messages_id}">
                <span class="content">${eachMessage.content}</span>
                <span class="create-time">${eachMessage.created_time}</span>
                ${edited ?
								`
                <span class="edited">edited</span>
                ` : ""}
                <button class="edit-content" onclick="editMessage(${eachMessage.messages_id},'${eachMessage.content}')">
                <img src="./edit-text.png" class="edit-text" alt="edit-text">
                </button>
                </div>
                `
							:
							`
                <div class="message" id="msgId-${eachMessage.messages_id}">
                <span class="username">${eachMessage.username}</span>
                <span class="content">${eachMessage.content}</span>
                <span class="create-time">${eachMessage.created_time}</span>
                ${edited ?
								`
                    <span class="edited">edited</span>
                    ` : ""}
                </div>
                `
						}`
				}
			}
			// messagesBox.innerHTML += "</div>"

		}
		messagesBox.scrollTop = messagesBox.scrollHeight - messagesBox.clientHeight
		// console.log(messagesBox.scrollTop)
		// messagesBox.scrollTop =0

		socket.emit('join', projectId);
	}


}

//===================== Send Message and Pick Last Message Below ====================
function sendMessageSubmit() {
	document.querySelector("#sendMessage").addEventListener("submit", async (event) => {
		event.preventDefault()
		sendMessage(projectId)
	})
}

sendMessageSubmit()

async function sendMessage(projectId) {
	let content = await document.querySelector(".text-content").value;
	console.log("content: ", content);

	if (content.trim() != "") {
		let res = await fetch('/chatroom', {
			method: "POST",
			headers: {
				"Content-Type": "application/json"
			},
			body: JSON.stringify({
				projectId: projectId,
				content: content
			})
		})
		if (res.ok) {
			let response = await res.json();
			let userId = response.userId;
			console.log("send message success");
			document.querySelector(".text-content").value = "";
			console.log(document.querySelector(".texting-box").innerHTML)
			console.log("11111: ", projectId)
			socket.emit('newMessage', { userId: userId, projectId: projectId, content: content });
		}
	}
}

socket.on('receive-newMessage', async lastMessageInfo => {
	console.log(lastMessageInfo);

	let res = await fetch('/auth/user')
	let response = await res.json();
	let myUserId = await response.data.id;
	console.log("my user id: ", myUserId);

	let msg = await lastMessageInfo.justSentMessage;
	let messagesBox = document.querySelector("#message-box")
	console.log("message user id: ", msg.users_id);

	messagesBox.innerHTML +=
		`
		${myUserId == msg.users_id ?
			`
			<div class="myMessage" id="msgId-${msg.messages_id}">
			<span class="content">${msg.content}</span>
			<span class="create-time">${msg.created_time}</span>
			<button class="edit-content" onclick="editMessage(${msg.messages_id},'${msg.content}')">
			<img src="./edit-text.png" class="edit-text" alt="edit-text">
			</button>
			</div>
			`
			:
			`
			<div class="message" id="msgId-${msg.messages_id}">
			<span class="username">${msg.username}</span>
			<span class="content">${msg.content}</span>
			<span class="create-time">${msg.created_time}</span>
			</div>
			`
		}
		`
	// document.querySelector("#text-content").value = "";
	messagesBox.scrollTop = messagesBox.scrollHeight - messagesBox.clientHeight
})





//===================== Edit My Message ====================
async function editMessage(messageId, content) {
	console.log("editMessage")
	document.querySelector(".texting-box").innerHTML =
		`
		<form id="sendEditMessage" onsubmit="confirmEdit(event,${messageId})">
			<input type="text" class="edit-textContent white-word" value="${content}">
			<button id="text-send" type="submit">Edit</button>
		</form>
	`

	console.log(document.querySelector(".texting-box").innerHTML)
	console.log("22222: ", projectId)
}

async function confirmEdit(event, messageId) {
	event.preventDefault()

	let content = document.querySelector(".edit-textContent").value;

	const res = await fetch('/chatroom', {
		method: 'PUT',
		headers: {
			"Content-Type": "application/json"
		},
		body: JSON.stringify({
			messageId: messageId,
			content: content
		})
	})

	if (res.ok) {
		let response = await res.json();
		let userId = response.userId;
		let content = response.date.content;

		socket.emit('editMessage', { messageId: messageId, userId: userId, content: content });
		console.log("Edit message success");


		document.querySelector(".texting-box").innerHTML =
			`
			<form id="sendMessage">
				<input type="text" id="text-content" class="text-content white-word">
				<button id="text-send" type="submit">Send</button>
			</form>
		`

		console.log(document.querySelector(".texting-box").innerHTML)
		console.log("33333: ", projectId)
		sendMessageSubmit()
	}
}

socket.on('receive-editMessage', async info => {
	console.log(info);

	let res = await fetch('/auth/user')
	let response = await res.json();
	let myUserId = await response.data.id;
	console.log("my user id: ", myUserId);

	let msg = await info.lastEditMessageInfo;
	let justEditMessage = document.querySelector(`#msgId-${msg.messages_id}`)
	console.log("message user id: ", msg.users_id);

	justEditMessage.innerHTML =
		`
		${myUserId == msg.users_id ?
			`
			<span class="content">${msg.content}</span>
			<span class="create-time">${msg.created_time}</span>
			<span class="edited">edited</span>
			<button class="edit-content" onclick="editMessage(${msg.messages_id},'${msg.content}')">
			<img src="./edit-text.png" class="edit-text" alt="edit-text">
			</button>
			`
			:
			`
			<span class="username">${msg.username}</span>
			<span class="content">${msg.content}</span>
			<span class="create-time">${msg.created_time}</span>
			<span class="edited">edited</span>
			`
		}
		`
})





//===================== Quit Chatroom ====================

document.querySelector(".quit-chat").addEventListener("click", async (event) => {
	event.preventDefault()

	let darkenArea = document.querySelector(".darken-area")
	darkenArea.style.display = "none";

	let chatroomBox = document.querySelector(".chatroom-box")
	chatroomBox.style.display = "none";

	let memberAndMessages = document.querySelector("#memberAndMessages")

	memberAndMessages.innerHTML = `
			<section id="member-area" class="col-2">
                <div class="list-title white-word">
                    <div>Teammates</div>
                </div>
                <div id="member-list" class="white-word">
                </div>
            </section>
            <section id="message-list" class="col">
                <div id="message-box">
                </div>
                <div class="texting-box">
                    <form id="sendMessage">
                        <input type="text" id="text-content" class="text-content white-word">
                        <button id="text-send" type="submit">Send</button>
                    </form>
                </div>
            </section>
	`
})

// async function quitChat() {
// event.preventDefault()


// window.location.reload();
// }


//===================== Get Other User Info ===================

async function getOtherUserInfo(userId) {
	let res = await fetch(`/auth/other-user?userId=${userId}`);
	let response = await res.json();
	let myUserId = response.myUserId;
	let user_id = response.data.id;
	let username = response.data.username;
	let email = response.data.email;
	let profileImage = response.data.profile_image

	console.log(response);
	document.querySelector(".darken-area").style.display = "none";
	document.querySelector(".outer-user-card").style.display = "block";
	document.querySelector(".user-card").style.display = "flex";

	document.querySelector(".user-card").innerHTML = `
    <div class="image-cropper">
        ${profileImage ? `<img src="/profile-image/${profileImage}" class="profilePic" />`
			:
			`<img src="01.jpg" class="profilePic" />`}
    </div>

    <div class="username">${username}</div>

    <div class="e-mail">${email}</div>

    `
}

document.querySelector(".darken-area").addEventListener("click", async (event) => {
	event.preventDefault()
	document.querySelector(".darken-area").style.display = "none";
	document.querySelector(".chatroom-box").style.display = "none";

	let memberAndMessages = document.querySelector("#memberAndMessages")

	memberAndMessages.innerHTML = `
			<section id="member-area" class="col-2">
                <div class="list-title white-word">
                    <div>Teammates</div>
                </div>
                <div id="member-list" class="white-word">
                </div>
            </section>
            <section id="message-list" class="col">
                <div id="message-box">
                </div>
                <div class="texting-box">
                    <form id="sendMessage">
                        <input type="text" id="text-content" class="text-content white-word">
                        <button id="text-send" type="submit">Send</button>
                    </form>
                </div>
            </section>
	`

	// document.querySelector(".outer-user-card").style.display = "none";
	// document.querySelector(".user-card").style.display = "none";
	// document.querySelector(".user-card").innerHTML = ""
})



document.querySelector(".outer-user-card").addEventListener("click", async (event) => {
	event.preventDefault()
	document.querySelector(".darken-area").style.display = "block";
	document.querySelector(".outer-user-card").style.display = "none";
	document.querySelector(".user-card").style.display = "none";
	document.querySelector(".user-card").innerHTML = ""
})






//===================== Display User Info On Project Page ===================

async function displayMember(data) {

	console.log(data)
	const memberArea = document.querySelector(".all-team-member")
	const users = data.users

	for (let user of users) {
		memberArea.innerHTML += 
			`
	<div class="team-member">
        <div class="team-member-username white-word" id="user_${user}">${user.username}</div>
        <div class="image-cropper">
        	<img ${user.profile_image ? `src="/profile-image/${user.profile_image}"` : `src=""`} class="profilePic" alt="">
        </div>
    </div>
	`
	}
}