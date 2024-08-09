import express from "express";
import expressSession from "express-session";
import dotenv from "dotenv";
import grant from "grant";
import http from "http";
import { projectRouter } from "./Router/projectRouter";
import { taskRouter } from "./Router/taskRouter";
import { authRouter } from "./Router/authRouter";
// import { chatRoomRouter } from "./Router/chatRoomRouter";
// import { testLoginRouter } from "./Router/testLoginRouter";
import { Server as SOCKETIO } from "socket.io";
import { isLoggedIn } from "./utils/guard";
import { chatRoomRouter, getJustSentMessage } from "./Router/chatRoomRouter";
import { getLastEditMessage } from "./Router/chatRoomRouter";
import { error } from "console";
import { mainPageDisplayRouter } from "./Router/mainPageDisplayRouter";
import { getProjectFromId } from "./Router/chatRoomRouter";
import path from "path";

const PORT = 8080
const app = express()

const server = new http.Server(app);
// console.log("what server is: ", server);

export const io = new SOCKETIO(server);
// console.log("what io is: ", io);

io.on('connection', function (socket: any) {

  // const req = socket.request as express.Request;
  // console.log(req.session.userId);
  // socket.request.session.save();
  io.emit('newConnection', "There is a new connection");

  // ==================== Client Send New Message In Chatroom ====================

  socket.on('newMessage', async (data: any) => {
    var justSentMessage = await getJustSentMessage(data.projectId);
    var userId = await data.userId;
    var projectId = await data.projectId;
    var projectInfo = await getProjectFromId(projectId);

    io.to(`chatroom-${projectId}`).emit('receive-newMessage', { userId: userId, justSentMessage: justSentMessage });
    socket.to(`projectRoom-${projectId}`).emit('you-have-a-new-message-this-project', { projectId: projectId, projectName: projectInfo.name });
    socket.to(`outerProjectRoom-${projectId}`).emit('you-have-a-new-message', { projectId: projectId, projectName: projectInfo.name });

    console.log("user id: ", userId);
    console.log("last message: ", justSentMessage);
  })

  // ==================== Client Edit Message From Chatroom ====================

  socket.on('editMessage', async (data: any) => {
    var lastEditMessageInfo = await getLastEditMessage(data.messageId);
    var userId = await data.userId;
    var projectId = await lastEditMessageInfo.project_id;

    io.to(`chatroom-${projectId}`).emit('receive-editMessage', { userId: userId, lastEditMessageInfo: lastEditMessageInfo });

    console.log("user id: ", userId);
    console.log("project id: ", projectId);
    console.log("last message info: ", lastEditMessageInfo);
  })

  // ==================== Client Join Rooms ====================

  socket.on('joinUserRoom', (userId: any) => {
    socket.join(`userRoom-${userId}`);
    io.in(`userRoom-${userId}`).emit(`user room joined, user id: ${userId}`);
  })

  socket.on('joinOuterProjectRoom', (outerProjectId: any) => {
    socket.join(`outerProjectRoom-${outerProjectId}`);
    io.to(`outerProjectRoom-${outerProjectId}`).emit(`outer project room joined, project id: ${outerProjectId}`);
  })

  socket.on('joinProjectRoom', (projectId: any) => {
    socket.join(`projectRoom-${projectId}`);
    io.in(`projectRoom-${projectId}`).emit('project room joined');
  })

  socket.on('joinChatroom', (projectId: any) => {
    socket.join(`chatroom-${projectId}`);
    io.to(`chatroom-${projectId}`).emit('chatroom joined');
  })

  // ==================== Add Project Member ====================

  socket.on('addMember', async (input: any) => {
    // var res = await fetch(`/projectRou/?id=${input.projectId}`)
    var projectId = input.projectId
    var userId = input.userId
    var projectInfo = await getProjectFromId(projectId);
    // var response = await res.json()
    io.to(`projectRoom-${projectId}`).emit('receive-addMember', { data: "A new user added in project" });
    io.to(`userRoom-${userId}`).emit('i-am-in', { projectName: projectInfo.name });
  })

  // ==================== Redraw Porject Task Status ====================

  socket.on('redrawProjectPage', async (input: any) => {
    var projectId = input.projectId
    io.to(`projectRoom-${projectId}`).emit('receive-redrawProjectPage', "project page redrawed");
  })

})

dotenv.config();

if (!process.env.SECRET || !process.env.GOOGLE_CLIENT_SECRET) {
  throw error("SECRET missing in .env");
}

app.use(
  expressSession({
    secret: process.env.SECRET,
    resave: true,
    saveUninitialized: true,
  })
);

const grantExpress = grant.express({
  defaults: {
    origin: "http://localhost:8080",
    transport: "session",
    state: true,
  },
  google: {
    key: process.env.GOOGLE_CLIENT_ID || "",
    secret: process.env.GOOGLE_CLIENT_SECRET || "",
    scope: ["profile", "email"],
    callback: "/auth/google-login",
  },
});

app.use(grantExpress as express.RequestHandler);

declare module "express-session" {
  interface SessionData {
    userId?: number;
    username?: string;
    grant?: any;
  }
}

app.use(express.json())
app.use(express.urlencoded({ extended: true }))
app.use("/projectRou", isLoggedIn, projectRouter)
app.use("/task", isLoggedIn, taskRouter)
app.use("/auth", authRouter)
app.use("/chatroom", isLoggedIn, chatRoomRouter)
app.use("/mainpage", isLoggedIn, mainPageDisplayRouter)
// app.use("/testLogin", testLoginRouter)

app.use("/project", isLoggedIn, express.static("private/projectPage"))
app.use("/chat", express.static("private/chatPage"))
app.use("/main", isLoggedIn, express.static("private/mainPage"))

app.use(express.static("uploads"))
app.use(express.static("public"))

app.use("/utils", express.static("utils"))
app.use("/init-project", express.static("private")) 

app.use((req, res) => {
  res.sendFile(path.resolve("./public/404.html"));
});

server.listen(PORT, () => {
  console.log(`listening to http://localhost:${PORT}`)
})