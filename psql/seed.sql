\c project_manager

--test user
INSERT INTO users (
    username,
    email,
    password,
    first_name,
    last_name,
    organization,
    location,
    registration_date
)
VALUES (
    'user',
    'user@gmail.com',
    '$2a$10$eNN3ZN7quzTH8EVswwi7N.YoavDWdwpWKKvNSvXuKd0jKeSe7FtiK',
    --hashed password for '!1Qwertyuiop'
    'John',
    'Doe',
    'My Company',
    'Hong Kong',
    CURRENT_DATE
);

INSERT INTO users (
    username,
    email,
    password,
    profile_image,
    first_name,
    last_name,
    organization,
    location,
    registration_date
)
VALUES (
    'billsfyuen225',
    'billsfyuen@hotmail.com',
    '$2a$10$eNN3ZN7quzTH8EVswwi7N.YoavDWdwpWKKvNSvXuKd0jKeSe7FtiK',
    --hashed password for '!1Qwertyuiop'
    'mydog.jpg',
    'Bill',
    'Yuen',
    'Tecky',
    'Los Angeles',
    CURRENT_DATE
);

--test project
insert into projects (name, start_date,min_duration, image) values ('Alpha', '2024-04-01',25, 'example.jpg');
insert into projects (name, start_date,min_duration) values ('Delta', '2024-04-01',25);
insert into projects (name, start_date,min_duration) values ('Beta', '2024-04-01',25);
insert into projects (name, start_date,min_duration) values ('Gemma', '2024-04-01',25);
insert into projects (name, start_date,min_duration) values ('Pi', '2024-04-01',25);
insert into projects (name, start_date,min_duration) values ('Zeta', '2024-04-01',25);
insert into projects (name, start_date,min_duration) values ('Energy', '2024-04-01',25);
insert into user_project_relation (user_id, project_id) values (1, 1);
insert into user_project_relation (user_id, project_id) values (1, 2);
insert into user_project_relation (user_id, project_id) values (1, 3);
insert into user_project_relation (user_id, project_id) values (2, 1);
insert into user_project_relation (user_id, project_id) values (2, 2);
insert into user_project_relation (user_id, project_id) values (2, 3);
insert into user_project_relation (user_id, project_id) values (1, 4);
insert into user_project_relation (user_id, project_id) values (1, 5);
insert into user_project_relation (user_id, project_id) values (1, 6);
insert into user_project_relation (user_id, project_id) values (1, 7);


--project 10 taskname ,startdate , duration, dependencies
insert into tasks (project_id, name, duration, start_date) values (1, 'root task', 0,'2024-04-01');
insert into tasks (project_id, name, duration, start_date,pre_req_fulfilled) values (1, 'Sonair', 4,'2024-04-01',true);
insert into tasks (project_id, name, duration, start_date) values (1, 'Tres-Zap', 3,'2024-04-05');
insert into tasks (project_id, name, duration, start_date) values (1, 'Tin', 6,'2024-04-05');
insert into tasks (project_id, name, duration, start_date) values (1, 'Alpha', 4,'2024-04-11');
insert into tasks (project_id, name, duration, start_date) values (1, 'Bytecard', 1,'2024-04-08');
insert into tasks (project_id, name, duration, start_date) values (1, 'Regrant', 8,'2024-04-08');
insert into tasks (project_id, name, duration, start_date) values (1, 'Hatity', 3,'2024-04-08');
insert into tasks (project_id, name, duration, start_date) values (1, 'Mat Lam Tam', 6,'2024-04-11');
insert into tasks (project_id, name, duration, start_date) values (1, 'Transcof', 9,'2024-04-09');
insert into tasks (project_id, name, duration, start_date) values (1, 'Stringtough', 2,'2024-04-15');
insert into tasks (project_id, name, duration, start_date) values (1, 'Tampflex', 8,'2024-04-18');

-- project 10 task relation
insert into task_relation (task_id, pre_req_task_id) values (2, 1);
insert into task_relation (task_id, pre_req_task_id) values (3, 2);
insert into task_relation (task_id, pre_req_task_id) values (4, 2);
insert into task_relation (task_id, pre_req_task_id) values (5, 4);
insert into task_relation (task_id, pre_req_task_id) values (6, 3);
insert into task_relation (task_id, pre_req_task_id) values (7, 3);
insert into task_relation (task_id, pre_req_task_id) values (8, 3);
insert into task_relation (task_id, pre_req_task_id) values (9, 8);
insert into task_relation (task_id, pre_req_task_id) values (10, 6);
insert into task_relation (task_id, pre_req_task_id) values (11, 5);
insert into task_relation (task_id, pre_req_task_id) values (12, 10);


insert into projects (name, start_date, min_duration) values('Dune 0','2024,04-01' 50)
insert into user_project_relation (user_id, project_id) values (55, 24);

insert into tasks (project_id, name, duration, start_date, pre_req_fulfilled) values (24, 'Root Task', 0,'2024-04-01',true);
insert into tasks (project_id, name, duration, start_date, pre_req_fulfilled) values (24, 'Story', 1,'2024-04-01',true);
insert into tasks (project_id, name, duration, start_date, pre_req_fulfilled) values (24, 'Assign Writer', 1,'2024-04-01',true);
insert into tasks (project_id, name, duration, start_date) values (24, 'Script', ,'2024-04-02');
insert into tasks (project_id, name, duration, start_date) values (24, 'Budget', 1,'2024-04-02');
insert into tasks (project_id, name, duration, start_date) values (24, 'Assign Production Crew', 1,'2024-04-03');
insert into tasks (project_id, name, duration, start_date) values (24, 'Casting', 1,'2024-04-04');
insert into tasks (project_id, name, duration, start_date) values (24, 'Script Breakdown', 1,'2024-04-05');
insert into tasks (project_id, name, duration, start_date) values (24, 'Makeup', 1,'2024-04-06');
insert into tasks (project_id, name, duration, start_date) values (24, 'Custume', 1,'2024-04-07');
insert into tasks (project_id, name, duration, start_date) values (24, 'Location Scouting', 1,'2024-04-08');
insert into tasks (project_id, name, duration, start_date) values (24, 'Art and Props', 1,'2024-04-09');
insert into tasks (project_id, name, duration, start_date) values (24, 'Pre-Production Finalization', 1,'2024-04-10');
insert into tasks (project_id, name, duration, start_date) values (24, 'Assign cinematographer', 1,'2024-04-11');
insert into tasks (project_id, name, duration, start_date) values (24, 'On-Site Shooting', 1,'2024-04-12');
insert into tasks (project_id, name, duration, start_date) values (24, 'First Draft Editing', 1,'2024-04-13');
insert into tasks (project_id, name, duration, start_date) values (24, 'More Shooting', 1,'2024-04-14');
insert into tasks (project_id, name, duration, start_date) values (24, 'Final Cut Editing', 1,'2024-04-15');
insert into tasks (project_id, name, duration, start_date) values (24, 'Music', 1,'2024-04-16');
insert into tasks (project_id, name, duration, start_date) values (24, 'Computer Graphic', 1,'2024-04-17');
insert into tasks (project_id, name, duration, start_date) values (24, 'Color Grading', 1,'2024-04-18');
insert into tasks (project_id, name, duration, start_date) values (24, 'Sound Design', 1,'2024-04-19');
insert into tasks (project_id, name, duration, start_date) values (24, 'Final Product', 1,'2024-04-20');
insert into tasks (project_id, name, duration, start_date) values (24, 'Marketing', 1,'2024-04-21');
insert into tasks (project_id, name, duration, start_date) values (24, 'Cinema Display', 1,'2024-04-22');


insert into task_relation (task_id, pre_req_task_id) values (102, 101);
insert into task_relation (task_id, pre_req_task_id) values (105, 101);
insert into task_relation (task_id, pre_req_task_id) values (103, 102);
insert into task_relation (task_id, pre_req_task_id) values (104, 103);
insert into task_relation (task_id, pre_req_task_id) values (106, 105);
insert into task_relation (task_id, pre_req_task_id) values (107, 105);
insert into task_relation (task_id, pre_req_task_id) values (108, 104);
insert into task_relation (task_id, pre_req_task_id) values (108, 106);
insert into task_relation (task_id, pre_req_task_id) values (109, 107);
insert into task_relation (task_id, pre_req_task_id) values (110, 107);

insert into task_relation (task_id, pre_req_task_id) values (111, 108);
insert into task_relation (task_id, pre_req_task_id) values (112, 108);
insert into task_relation (task_id, pre_req_task_id) values (113, 109);
insert into task_relation (task_id, pre_req_task_id) values (113, 110);
insert into task_relation (task_id, pre_req_task_id) values (113, 111);
insert into task_relation (task_id, pre_req_task_id) values (113, 112);
insert into task_relation (task_id, pre_req_task_id) values (114, 113);
insert into task_relation (task_id, pre_req_task_id) values (115, 114);
insert into task_relation (task_id, pre_req_task_id) values (116, 115);
insert into task_relation (task_id, pre_req_task_id) values (117, 116);
insert into task_relation (task_id, pre_req_task_id) values (118, 117);

insert into task_relation (task_id, pre_req_task_id) values (119,118);
insert into task_relation (task_id, pre_req_task_id) values (120,118);
insert into task_relation (task_id, pre_req_task_id) values (121,118);
insert into task_relation (task_id, pre_req_task_id) values (122,118);

insert into task_relation (task_id, pre_req_task_id) values (123,119);
insert into task_relation (task_id, pre_req_task_id) values (123,120);
insert into task_relation (task_id, pre_req_task_id) values (123,121);
insert into task_relation (task_id, pre_req_task_id) values (123,122);

insert into task_relation (task_id, pre_req_task_id) values (124,123);
insert into task_relation (task_id, pre_req_task_id) values (125,124);

