const socket = io.connect();

// import PerfectScrollbar from 'perfect-scrollbar';

// socket.on('newConnection', function(data){
//     console.log(data);
// })

var searchParams = new URLSearchParams(window.location.search);
const projectId = searchParams.get("project");
("current project id: ", projectId);



// Socket.on('newMessage', function (data) {
//     console.log(data)
// })


document.querySelector("#login").addEventListener("submit", async (event) => {
    event.preventDefault()

    const username = await document.querySelector("#username").value;
    const password = await document.querySelector("#password").value;
    (username);
    (password);

    let res = await fetch(`/testLogin`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            username: username,
            password: password
        })
    })

    let response = await res.json();
    (response);

    if (res.ok) {
        console.log("login success");
        let target = document.querySelector(".login-area");
        target.innerHTML = `
        <div>
        ${response.username}
        </div>`
        window.location.reload()
    }
})

document.querySelector("#login1").addEventListener("submit", async (event) => {
    event.preventDefault()

    const username = await document.querySelector("#username1").value;
    const password = await document.querySelector("#password1").value;
    (username);
    (password);

    let res = await fetch(`/testLogin`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            username: username,
            password: password
        })
    })

    let response = await res.json();
    (response);

    if (res.ok) {
        console.log("login success");
        let target = document.querySelector(".login-area");
        target.innerHTML = `
        <div>
        ${response.username}
        </div>`
        window.location.reload()
    }
})

async function testLoginOk() {
    let res = await fetch(`/testLogin`)
    let response = await res.json();
    let target = document.querySelector(".login-area");

    if (res.ok) {
        target.innerHTML = `
    <div>
    ${response.username}
    </div>`
    }
}

testLoginOk()


//===================== Useful Below ====================





//===================== Get All Members And Messages Below ====================

getAllMessages(projectId);

async function getAllMessages(projectId) {

    window["getOtherUserInfo"] = getOtherUserInfo;

    let res = await fetch(`/chatroom?projectId=${projectId}`)

    let response = await res.json();

    let allMessagesDate = response.allMessagesDate;
    let allMessages = response.allMessages;
    let allMembers = response.groupMembers;
    let edited

    if (res.ok) {
        // let chatroomBox = document.querySelector(".chatroom-box")

        // chatroomBox.innerHTML = `
        // <article id="memberAndMessages" class="row">
        //     <section id="member-area" class="col-2">
        
        //         <div class="list-title white-word">
        //             <div>Teammates</div>
        //         </div>
        
        //         <div id="member-list" class="white-word">
        //         </div>

        //     </section>

        //     <section id="message-list" class="col">

        //         <div id="message-box">
        //         </div>

        //         <div id="texting-box">
        //             <form id="sendMessage">
        //                 <input type="text" name="text_content" class="text-content white-word">
        //                 <button class="text-send" type="submit">Send</button>
        //             </form>
        //         </div>

        //     </section>
        // </article>

        // <button type="button" id="quit-chat" onclick="quitChat()">Quit Chat</button>
        // `

        let memberList = document.querySelector("#member-list")

        for (let eachMember of allMembers) {
            memberList.innerHTML +=
                `
            <div class="member">
            <div class="username" onclick="getOtherUserInfo(${eachMember.user_id})">${eachMember.username}</div>
            <div class="image-cropper">
            ${eachMember.profile_image ? `<img src="/profile-image/${eachMember.profile_image}" class="profilePic" />` :
                    `<img src="01.jpg" class="profilePic" />`}
            </div>
            </div>
            `
        }





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
        // messagesBox.scrollTop =0

        socket.emit('join', projectId);
    }
}





//===================== Send Message and Pick Last Message Below ====================

document.querySelector("#sendMessage").addEventListener("submit", async (event) => {
    event.preventDefault()
    sendMessage(projectId)
})

async function sendMessage(projectId) {
    const content = await document.querySelector(".text-content").value;

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
            socket.emit('newMessage', { userId: userId, projectId: projectId, content: content });

        }
    }
}

socket.on('receive-newMessage', async lastMessageInfo => {
    (lastMessageInfo);

    let res = await fetch('/auth/user')
    let response = await res.json();
    (response.data);
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

    messagesBox.scrollTop = messagesBox.scrollHeight - messagesBox.clientHeight
})





//===================== Edit My Message ====================
async function editMessage(messageId, content) {

    document.querySelector("#texting-box").innerHTML =
        `
        <form id="sendEditMessage" onsubmit="confirmEdit(event,${messageId})">
            <input type="text" name="text_content" class="edit-text-content white-word" value="${content}">
            <button class="edit-text-send" type="submit">Edit</button>
        </form>
    `
}

async function confirmEdit(event, messageId) {
    event.preventDefault()

    let content = document.querySelector(".edit-text-content").value;

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
        (response);

        socket.emit('editMessage', { messageId: messageId, userId: userId, content: content });
        console.log("Edit message success");


        document.querySelector("#texting-box").innerHTML =
            `
        <form id="sendMessage">
            <input type="text" name="text_content" class="text-content white-word">
            <button class="text-send" type="submit">Send</button>
        </form>
        `
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








async function getOtherUserInfo(userId) {
    let res = await fetch(`/auth/other-user?userId=${userId}`);
    let response = await res.json();
    let myUserId = response.myUserId;
    let user_id = response.data.id;
    let username = response.data.username;
    let email = response.data.email;
    let profileImage = response.data.profile_image

    (response);
    
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


document.querySelector(".outer-user-card").addEventListener("click", async (event) => {
    event.preventDefault()
    document.querySelector(".outer-user-card").style.display = "none";
    document.querySelector(".user-card").style.display = "none";
    document.querySelector(".user-card").innerHTML = ""
})
                




//===================== Quit Chatroom ====================

async function quitChat() {
    let memberAndMessages = document.querySelector(".memberAndMessages")
    memberAndMessages.innerHTML = ""
}


    // <script>
    // function getParams() {
    //   // const urlParams = new URLSearchParams(window.location.search);
    //   const urlParams = new URLSearchParams('id=4&comment=25');
    //   const id = urlParams.get('id');
    //   const comment = urlParams.get('comment');
    
    //   return { id: id, comment: comment };
    // }
    
    // const { id, comment } = getParams();
    // </script>