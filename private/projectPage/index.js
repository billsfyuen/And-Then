import { getFinishDate } from "../../utils/getFinishDate.js";
import { generateImageElement } from "../../utils/generateImageElement.js";
import { generateUserContent } from "../../utils/generateUserContent.js";

const socket = io.connect();

var searchParams = new URLSearchParams(window.location.search);
const projectId = searchParams.get("id");

async function getProjectData(id) {
	const res = await fetch(`/projectRou/?id=${id}`)
	const data = (await res.json()).data
	return data
}

window.addEventListener("load", async (e) => {
	try {
		const data = await getProjectData(projectId)
		displayMember(data)
		socket.emit('joinProjectRoom', projectId)
		await drawPage(data)
		document.querySelector(".project-big-name").innerHTML = `${data.name}`

		const finishbtns = document.querySelectorAll(".finish-btn")
		finishbtns.forEach((btn) => {
			btn.addEventListener("click", async (e) => {
				let taskId = (e.currentTarget.parentElement.parentElement.parentElement.id).slice(5)

				await finishTask(taskId)
				// await socket.emit('redrawProjectPage', { projectId: projectId });
				// window.location.reload()

			})
		})
		const assignBtns = document.querySelectorAll(".assign-btn")
		assignBtns.forEach((btn) => {
			btn.addEventListener("click", async (e) => {
				let taskId = (e.currentTarget.parentElement.parentElement.parentElement.id).slice(5)

				console.log(taskId);

				await assignTask(taskId)
				socket.emit('redrawProjectPage', { projectId: projectId });
				// window.location.reload()
			})
		})
	} catch (error) {
		console.log(error);
	}
})

socket.on('receive-redrawProjectPage', async notImportant => {
	console.log("GGGGGGGG: ", notImportant);

	const res = await fetch(`/projectRou/?id=${projectId}`)
	const data = (await res.json()).data

	// const projectData = chartData(data)
	// const taskRelation = chartRelation(data)

	gantt.config.date_format = "%Y-%m-%d";
	gantt.init("gantt_here");

	gantt.parse({
		data: [],
		links: []
	});
	const rootTaskId = data.tasks[0].id

	gantt.getTask(rootTaskId).readonly = true;

	document.querySelector(".inside-jira-task-box-finished").innerHTML = ""
	document.querySelector(".inside-jira-task-box-ongoing").innerHTML = ""
	document.querySelector(".inside-jira-task-box-to-do-list").innerHTML = ""

	await drawPage(data);

	const finishbtns = document.querySelectorAll(".finish-btn")
	finishbtns.forEach((btn) => {
		btn.addEventListener("click", async (e) => {
			let taskId = (e.currentTarget.parentElement.parentElement.parentElement.id).slice(5)

			await finishTask(taskId)
			// window.location.reload()
		})
	})
	const assignBtns = document.querySelectorAll(".assign-btn")
	assignBtns.forEach((btn) => {
		btn.addEventListener("click", async (e) => {
			let taskId = (e.currentTarget.parentElement.parentElement.parentElement.id).slice(5)

			console.log(taskId);

			await assignTask(taskId)
			// window.location.reload()
		})
	})
})

socket.on('you-have-a-new-message-this-project', async projectInfo => {
	// let projectId = projectInfo.projectId;
	// let projectName = projectInfo.projectName;
	console.log(projectInfo)

	Swal.fire({
		position: "top",
		height: "500px",
		// icon: "info",
		text: "You have a new message in this project",
		showConfirmButton: false,
		timerProgressBar: true,
		timer: 2000
	});
})

gantt.attachEvent("onAfterTaskDelete", async (id, item) => {
	try {
		// const taskData = (await getProjectData(projectId)).tasks
		if (id) {
			let res = await fetch('/task', {
				method: "DELETE",
				headers: {
					"Content-Type": "application/json"
				},
				body: JSON.stringify({
					taskId: id,
					projectId: projectId
				})
			})
			// socket.emit('redrawProjectPage', { projectId: projectId });
			let message = (await res.json()).message
			console.log(message);
			// window.location.reload();
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

	const res = await fetch("/task", {
		method: "POST",
		headers: {
			'Content-Type': 'application/json',
		},
		body: JSON.stringify(req),
	});
	// socket.emit('redrawProjectPage', { projectId: projectId });
	// window.location.reload();
});

gantt.attachEvent("onAfterTaskUpdate", async function (id, item) {
	// console.log(id)
	// const taskData = (await getProjectData(projectId)).tasks
	// console.log(taskData)
	// console.log(item)

	// const taskId = taskData[id].id

	const req = {
		projectId: projectId,
		taskId: id,
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
	socket.emit('redrawProjectPage', { projectId: projectId });
});

gantt.attachEvent("onAfterLinkDelete", async function (id, item) {
	const tasksData = (await getProjectData(projectId)).tasks
	console.log(tasksData)
	console.log(item)
	const sourceId = item.source
	const targetId = item.target

	// const preTask = tasksData[item.source];
	// const task = tasksData[item.target];
	const req = {
		projectId: projectId,
		preTask: sourceId,
		taskId: targetId
	}
	let res = await fetch('/task/relation', {
		method: "DELETE",
		headers: {
			"Content-Type": "application/json"
		},
		body: JSON.stringify(req)
	})
	socket.emit('redrawProjectPage', { projectId: projectId });
	// window.location.reload();
});

gantt.attachEvent("onAfterLinkAdd", async function (id, item) {
	const tasksData = (await getProjectData(projectId)).tasks

	const sourceId = item.source
	const targetId = item.target

	const req = {
		projectId: projectId,
		preTask: sourceId,
		taskId: targetId
	}
	let res = await fetch('/task/relation', {
		method: "POST",
		headers: {
			"Content-Type": "application/json"
		},
		body: JSON.stringify(req)
	})
	socket.emit('redrawProjectPage', { projectId: projectId });
});


function chartData(data) {
	console.log(data)
	// const tasks = data.tasks
	let projects = {
		data: [],
		relation: []
	}
	const rootTaskId = data.tasks[0].id

	for (let i = 0; i < data.tasks.length; i++) {
		let taskData = data.tasks[i]
		let temp = {}
		temp.id = taskData.id
		temp.text = taskData.name
		temp.start_date = taskData.start_date
		temp.duration = i == 0 ? data.min_duration : parseInt(taskData.duration)
		if (taskData.actual_finish_date) {
			temp.progress = 1
		}
		projects.data.push(temp)

		let relation = data.tasks[i].relation.preTask
		if (relation.length > 0) {
			for (let j = 0; j < relation.length; j++) {
				if (relation[j] == rootTaskId) {
					continue
				}
				let temp = {}
				temp.id = i + 1
				temp.source = relation[j]
				temp.target = taskData.id
				temp.type = "0"
				projects.relation.push(temp)
			}
		}
	}
	console.log(projects)
	return projects
}


function createGanttChart(data) {
	const chartDataObj = chartData(data)
	const projectData2 = chartDataObj.data
	const taskRelation = chartDataObj.relation

	gantt.config.date_format = "%Y-%m-%d";

	gantt.init("gantt_here");

	gantt.parse({
		data: projectData2,
		links: taskRelation
	});
	gantt.getTask(data.tasks[0].id).readonly = true;
}

async function displayTaskList(data) {
	const tasks = data.tasks
	const res = await fetch("/auth/user")
	const userId = (await res.json()).data.id

	for (let task of tasks) {
		let imageElm;

		if (task.userRelation[0]) {
			imageElm = generateImageElement(
				task.userRelation[0].profile_image,
				task.userRelation[0].username
			);
		}

		if ((task.name).includes("root")) {
			continue
		}

		if (task.actual_finish_date) {
			document.querySelector(".inside-jira-task-box-finished").innerHTML += `
            
				<div class="inside-jira-task white-word" id="task_${task.id}">
					<div class="task-name" id="${task.id}">
						${task.userRelation[0] ? `<span class="image-cropper">${imageElm}</span>` : ""}
						${task.name}
					</div>
					<div class="task-any-fucking-icon"></div>
				</div>`

		} else if (task.pre_req_fulfilled) {
			document.querySelector(".inside-jira-task-box-ongoing").innerHTML += `
			
				<div class="inside-jira-task white-word" id="task_${task.id}">

					<div class="task-name">
						${task.userRelation[0] ? `<span class="image-cropper">${imageElm}</span>` : ""}
						${task.name}
					</div>

					<div class="task-any-fucking-icon">
						<div class="btn-container">
							<button class="assign-btn"><i class="fa-solid fa-plus"></i></button>
                			${task.userRelation[0] ? (userId == task.userRelation[0].userid ? '<button class="finish-btn"><i class="fa-solid fa-check"></i></button>' : "") : ''}
						</div>
					</div>
				</div>`

		} else {
			document.querySelector(".inside-jira-task-box-to-do-list").innerHTML += `
			
				<div class="inside-jira-task white-word" id="task_${task.id}">
					<div class="task-name">
						${task.userRelation[0] ? `<span class="image-cropper">${imageElm}</span>` : ""}
						${task.name}
					</div>
					<div class="task-any-fucking-icon">
						<div class="btn-container">
							<button class="assign-btn"><i class="fa-solid fa-plus"></i></button>
						</div>
					</div>
				</div>`
		}
	}
}

async function drawPage(data) {
	// const data = await getProjectData(projectId)
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
				socket.emit('redrawProjectPage', { projectId: projectId });
			}
		} catch (error) {
			console.log(error);
		}
	});
}

async function finishTask(taskId) {
	let flag = false;

Swal.fire({
		title: "Is the task finished?",
		icon: "question",
		showCancelButton: true,
		confirmButtonColor: "#3085d6",
		cancelButtonColor: "#d33",
		confirmButtonText: "Yes, I am finished!"
	}).then(async (result) => {
		if (result.isConfirmed) {
			flag = true;

			Swal.fire({
				title: "finished!!",
				text: "Your task has been finished.",
				icon: "success"
			});
		} if (flag == true) {
			const res = await fetch('/task/finish', {
				method: "PUT",
				headers: {
					"Content-Type": "application/json"
				},
				body: JSON.stringify({ id: taskId, projectId: projectId })
			})
			if (res.ok) {
                socket.emit('redrawProjectPage', { projectId: projectId });
            }
		}
	});
	// socket.emit('redrawProjectPage', { projectId: projectId });
}

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
})


window["editMessage"] = editMessage;
window["confirmEdit"] = confirmEdit;
window["getOtherUserInfo"] = getOtherUserInfo;
window["sendMessage"] = sendMessage;
window["getOtherUserInfoFromChat"] = getOtherUserInfoFromChat;

//===================== Get All Members And Messages Below ====================

async function getAllMessages(projectId) {

	let res = await fetch(`/chatroom/message/${projectId}`)

	let response = await res.json();

	let allMessagesDate = response.allMessagesDate;
	let allMessages = response.allMessages;
	let allMembers = response.groupMembers;
	let edited

	if (res.ok) {

		let memberList = document.querySelector("#member-list")

		for (let eachMember of allMembers) {

			let imageElm = generateImageElement(eachMember.profile_image, eachMember.username)

			memberList.innerHTML +=
				`
            <div class="member">
            <div class="username" onclick="getOtherUserInfoFromChat(${eachMember.user_id})">${eachMember.username}</div>
            <div class="image-cropper" onclick="getOtherUserInfoFromChat(${eachMember.user_id})">
			${imageElm}
            </div></div>`
		}

		// onclick="async() => {await editMessage(${eachMessage.messages_id},'${eachMessage.content}') } "

		let messagesBox = document.querySelector("#message-box")
		// console.log(allMessages);

		for (let eachMessageDate of allMessagesDate) {
			console.log(eachMessageDate)
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
                <img src="/assets/edit-text.png" class="edit-text" alt="edit-text">
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

		socket.emit('joinChatroom', projectId);
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
	// console.log("content: ", content);

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
			// console.log(document.querySelector(".texting-box").innerHTML)
			// console.log("11111: ", projectId)
			socket.emit('newMessage', { userId: userId, projectId: projectId, content: content });
		}
	}
}

socket.on('receive-newMessage', async lastMessageInfo => {
	// console.log(lastMessageInfo);

	let res = await fetch('/auth/user')
	let response = await res.json();
	let myUserId = await response.data.id;
	// console.log("my user id: ", myUserId);

	let msg = await lastMessageInfo.justSentMessage;
	let messagesBox = document.querySelector("#message-box")
	// console.log("message user id: ", msg.users_id);

	messagesBox.innerHTML +=
		`
		${myUserId == msg.users_id ?
			`
			<div class="myMessage" id="msgId-${msg.messages_id}">
			<span class="content">${msg.content}</span>
			<span class="create-time">${msg.created_time}</span>
			<button class="edit-content" onclick="editMessage(${msg.messages_id},'${msg.content}')">
			<img src="/assets/edit-text.png" class="edit-text" alt="edit-text">
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
	// console.log("editMessage")
	document.querySelector(".texting-box").innerHTML =
		`
		<form id="sendEditMessage" onsubmit="confirmEdit(event,${messageId})">
			<input type="text" class="edit-textContent white-word" value="${content}">
			<button id="text-send" type="submit">Edit</button>
		</form>
	`

	// console.log(document.querySelector(".texting-box").innerHTML)
	// console.log("22222: ", projectId)
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

		// console.log(document.querySelector(".texting-box").innerHTML)
		// console.log("33333: ", projectId)
		sendMessageSubmit()
	}
}

socket.on('receive-editMessage', async info => {
	// console.log(info);

	let res = await fetch('/auth/user')
	let response = await res.json();
	let myUserId = await response.data.id;
	// console.log("my user id: ", myUserId);

	let msg = await info.lastEditMessageInfo;
	let justEditMessage = document.querySelector(`#msgId-${msg.messages_id}`)
	// console.log("message user id: ", msg.users_id);

	justEditMessage.innerHTML =
		`
		${myUserId == msg.users_id ?
			`
			<span class="content">${msg.content}</span>
			<span class="create-time">${msg.created_time}</span>
			<span class="edited">edited</span>
			<button class="edit-content" onclick="editMessage(${msg.messages_id},'${msg.content}')">
			<img src="/assets/edit-text.png" class="edit-text" alt="edit-text">
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

	sendMessageSubmit()
})

// async function quitChat() {
// event.preventDefault()

// window.location.reload();
// }

//===================== Get Other User Info ===================

window['removeSelfFromProject'] = removeSelfFromProject;
window['removeMemberFromProject'] = removeMemberFromProject;

async function getOtherUserInfoFromChat(userId) {

	let res = await fetch(`/auth/other-user?userId=${userId}`);

	let response = await res.json();

	let myUserId = response.myUserId;
	let user_id = response.data.id;
	let username = response.data.username;
	let email = response.data.email;
	let fullName = response.data.full_name;
	let location = response.data.location;
	let organization = response.data.organization;
	let profileImage = response.data.profile_image

	let imageElm = generateImageElement(profileImage, username);
	let userContentElm = generateUserContent(username, email, fullName, location, organization);

	let buttonElm = (myUserId == user_id) ?
		`<button class="quit-group" onclick="removeSelfFromProject(${myUserId})">Quit Group</button>`
		:
		`<button class="remove-member" onclick="removeMemberFromProject(${user_id}, '${username}')">Remove Group Member</button>`

	document.querySelector(".darken-area").style.display = "none";
	document.querySelector(".outer-user-card").style.display = "block";
	document.querySelector(".user-card").style.display = "flex";

	document.querySelector(".user-card").innerHTML = `
    	<div class="image-cropper">${imageElm}</div>
		${userContentElm}
		${buttonElm}`
}

async function getOtherUserInfo(userId) {
	let res = await fetch(`/auth/other-user?userId=${userId}`);
	let response = await res.json();
	let myUserId = response.myUserId;
	let user_id = response.data.id;
	let username = response.data.username;
	let email = response.data.email;
	let fullName = response.data.full_name;
	let location = response.data.location;
	let organization = response.data.organization;
	let profileImage = response.data.profile_image

	let imageElm = generateImageElement(profileImage, username);
	let userContentElm = generateUserContent(username, email, fullName, location, organization);

	let buttonElm = (myUserId == user_id) ?
		`<button class="quit-group" onclick="removeSelfFromProject(${myUserId})">Quit Group</button>`
		:
		`<button class="remove-member" onclick="removeMemberFromProject(${user_id}, '${username}')">Remove Group Member</button>`

	document.querySelector(".darken-area").style.display = "block";
	document.querySelector(".user-card").style.display = "flex";

	document.querySelector(".user-card").innerHTML = `
    	<div class="image-cropper">${imageElm}</div>
		${userContentElm}
		${buttonElm}`
}

document.querySelector(".darken-area").addEventListener("click", async (event) => {
	event.preventDefault()
	document.querySelector(".darken-area").style.display = "none";
	document.querySelector(".chatroom-box").style.display = "none";
	document.querySelector(".search-user-card").style.display = "none";
	document.querySelector("#search").value = "";

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
	allDarkenAreaDisappear()
	sendMessageSubmit()
	// document.querySelector(".outer-user-card").style.display = "none";
	// document.querySelector(".user-card").style.display = "none";
	// document.querySelector(".user-card").innerHTML = ""
})

document.querySelector(".outer-user-card").addEventListener("click", async (event) => {
	event.preventDefault()
	document.querySelector(".darken-area").style.display = "block";
	document.querySelector(".outer-user-card").style.display = "none";
	document.querySelector(".user-card").style.display = "none";
	sendMessageSubmit()
})

//===================== Search And Add User Into Project ===================

document.querySelector(".add-member").addEventListener("click", async (event) => {
	event.preventDefault()
	document.querySelector(".user-info-list").innerHTML = ""; //clear previous search result
	document.querySelector(".darken-area").style.display = "block";
	document.querySelector(".search-user-card").style.display = "flex";
})

//===================== Display User Info On Project Page ===================

async function displayMember(data) {

	const memberArea = document.querySelector(".all-team-member")
	const users = data.users

	for (let user of users) {
		let imageElm = generateImageElement(user.profile_image, user.username);

		memberArea.innerHTML += `
			<div class="team-member">
        	<div class="team-member-username white-word" id="user_${user}" onclick="getOtherUserInfo(${user.id})">${user.username}</div>
        	<div class="image-cropper" onclick="getOtherUserInfo(${user.id})">
			${imageElm}
        	</div></div>`
	}
}

socket.on('receive-addMember', async notImportant => {
	console.log(notImportant);
	const data = await getProjectData(projectId)
	console.log(data);
	const memberArea = document.querySelector(".all-team-member")
	memberArea.innerHTML = "";
	await displayMember(data)

	let memberList = document.querySelector("#member-list")
	memberList.innerHTML = "";

	for await (let user of data.users) {
		memberList.innerHTML +=
			`
            <div class="member">
            <div class="username" onclick="getOtherUserInfoFromChat(${user.user_id})">${user.username}</div>
            <div class="image-cropper" onclick="getOtherUserInfoFromChat(${user.user_id})">
            ${user.profile_image ? `<img src="/profile-image/${user.profile_image}" class="profilePic" />` :
				`<img src="01.jpg" class="profilePic" />`}
            </div>
            </div>
            `
	}
})

//===================== All Darken Area Disapper ===================

function allDarkenAreaDisappear() {
	document.querySelector(".darken-area").style.display = "none";
	document.querySelector(".outer-user-card").style.display = "none";
	document.querySelector(".user-card").style.display = "none";
	document.querySelector(".user-card").innerHTML = ""
	document.querySelector(".search-user-card").style.display = "none";
	document.querySelector("#search").value = "";
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
}

//===================== Logout ===================

document.querySelector(".logout").addEventListener("click", (e) => {

	e.preventDefault();

	Swal.fire({
		title: "Do you want to logout",
		showCancelButton: true,
		confirmButtonText: "Yes",
		confirmButtonColor: "#779b9a",
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

//user self quit group
async function removeSelfFromProject(id) {

	Swal.fire({
		title: `Are you sure you want to remove yourself from this project?`,
		confirmButtonText: "Yes",
		confirmButtonColor: "#779b9a",
		showCancelButton: true,
	}).then((result) => {
		if (result.isConfirmed) {
			runRemoveMember(id);
		}
	});

}

//remove member
function removeMemberFromProject(id, username) {

	Swal.fire({
		title: `Are you sure you want to remove ${username} from this project?`,
		confirmButtonText: "Yes",
		confirmButtonColor: "#779b9a",
		showCancelButton: true,
	}).then((result) => {
		if (result.isConfirmed) {
			runRemoveMember(id, username);
		}
	});

}

//projectId from global const
async function runRemoveMember(id, username = "self") {

	let res = await fetch("/projectRou/remove-user", {
		method: "delete",
		headers: {
			"Content-Type": "application/json"
		},
		body: JSON.stringify({ projectId: projectId, userId: id }) //projectId from global const
	})

	let result = await res.json();

	let titleMessage, runPage;

	if (username === "self") {
		titleMessage = `Removed yourself from this project!`
		runPage = function () { window.location.href = `../main?id=${id}` }
	} else {
		titleMessage = `Removed ${username} from this project!`;
		runPage = function () { window.location.reload() }
	}

	if (res.ok) {

		Swal.fire({
			title: titleMessage,
			confirmButtonText: "Continue",
			confirmButtonColor: "#779b9a"
		}).then((result) => {
			if (result.isConfirmed) {
				runPage();
			}
		});

	} else {
		console.log("unknown error to be handled...")
		console.log(result);
	}
}