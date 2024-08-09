DROP TABLE IF EXISTS project_manager;
DROP DATABASE project_manager;
CREATE DATABASE project_manager;

\c project_manager

CREATE TABLE "task_relation"(
    "id" SERIAL NOT NULL,
    "task_id" BIGINT NOT NULL,
    "pre_req_task_id" BIGINT NOT NULL
);
ALTER TABLE
    "task_relation" ADD PRIMARY KEY("id");
CREATE TABLE "tasks"(
    "id" SERIAL NOT NULL,
    "project_id" BIGINT NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "pre_req_fulfilled" BOOLEAN NOT NULL DEFAULT '0',
    "start_date" DATE NOT NULL,
    "duration" BIGINT NOT NULL,
    "actual_finish_date" DATE NULL
);
ALTER TABLE
    "tasks" ADD PRIMARY KEY("id");
CREATE TABLE "user_task_relation"(
    "id" SERIAL NOT NULL,
    "user_project_relation_id" BIGINT NOT NULL,
    "task_id" BIGINT NOT NULL
);
ALTER TABLE
    "user_task_relation" ADD PRIMARY KEY("id");
CREATE TABLE "messages"(
    "id" SERIAL NOT NULL,
    "user_id" BIGINT NOT NULL,
    "project_id" BIGINT NOT NULL,
    "content" VARCHAR(255) NOT NULL,
    "created_at" TIMESTAMP(0) WITH
        TIME zone NOT NULL DEFAULT 'NOW()',
        "edited_at" TIMESTAMP(0)
    WITH
        TIME zone NULL
);
ALTER TABLE
    "messages" ADD PRIMARY KEY("id");
CREATE TABLE "projects"(
    "id" SERIAL NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "image" VARCHAR(255) NULL,
    "start_date" DATE NOT NULL,
    "min_duration" BIGINT NULL,
    "actual_finish_date" DATE NULL
);
ALTER TABLE
    "projects" ADD PRIMARY KEY("id");
CREATE TABLE "users"(
    "id" SERIAL NOT NULL,
    "username" VARCHAR(255) NOT NULL,
    "email" VARCHAR(255) NOT NULL,
    "password" VARCHAR(255) NOT NULL,
    "profile_image" VARCHAR(255) NULL,
    "first_name" VARCHAR(255) NOT NULL DEFAULT 'Small',
    "last_name" VARCHAR(255) NOT NULL DEFAULT 'Potato',
    "organization" VARCHAR(255) DEFAULT 'Not Specified',
    "location" VARCHAR(255) DEFAULT 'Hong Kong',
    "last_login" TIMESTAMP(0) WITH TIME zone NULL,
    "registration_date" DATE NOT NULL DEFAULT 'NOW()'
);
ALTER TABLE
    "users" ADD PRIMARY KEY("id");
ALTER TABLE
    "users" ADD CONSTRAINT "users_username_unique" UNIQUE("username");
ALTER TABLE
    "users" ADD CONSTRAINT "users_email_unique" UNIQUE("email");
CREATE TABLE "user_project_relation"(
    "id" SERIAL NOT NULL,
    "user_id" BIGINT NOT NULL,
    "project_id" BIGINT NOT NULL,
    "permission_level" BIGINT NULL
);
ALTER TABLE
    "user_project_relation" ADD PRIMARY KEY("id");
COMMENT
ON COLUMN
    "user_project_relation"."permission_level" IS '2: manager 
1: normal sstaff';
ALTER TABLE
    "task_relation" ADD CONSTRAINT "task_relation_task_id_foreign" FOREIGN KEY("task_id") REFERENCES "tasks"("id");
ALTER TABLE
    "user_project_relation" ADD CONSTRAINT "user_project_relation_user_id_foreign" FOREIGN KEY("user_id") REFERENCES "users"("id");
ALTER TABLE
    "user_project_relation" ADD CONSTRAINT "user_project_relation_project_id_foreign" FOREIGN KEY("project_id") REFERENCES "projects"("id");
ALTER TABLE
    "user_task_relation" ADD CONSTRAINT "user_task_relation_user_project_relation_id_foreign" FOREIGN KEY("user_project_relation_id") REFERENCES "user_project_relation"("id");
ALTER TABLE
    "messages" ADD CONSTRAINT "messages_project_id_foreign" FOREIGN KEY("project_id") REFERENCES "projects"("id");
ALTER TABLE
    "messages" ADD CONSTRAINT "messages_user_id_foreign" FOREIGN KEY("user_id") REFERENCES "users"("id");
ALTER TABLE
    "task_relation" ADD CONSTRAINT "task_relation_pre_req_task_id_foreign" FOREIGN KEY("pre_req_task_id") REFERENCES "tasks"("id");
ALTER TABLE
    "tasks" ADD CONSTRAINT "tasks_project_id_foreign" FOREIGN KEY("project_id") REFERENCES "projects"("id");
ALTER TABLE
    "user_task_relation" ADD CONSTRAINT "user_task_relation_task_id_foreign" FOREIGN KEY("task_id") REFERENCES "tasks"("id");