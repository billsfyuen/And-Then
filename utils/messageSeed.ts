// -- messages sample

// insert into messages (user_id, project_id, content) values (19, 2, 'proin at turpis a pede posuere nonummy integer non velit');

import { faker } from '@faker-js/faker';
import { pgClient } from './pgClient';

async function fakeMessage() {
    faker.seed(11)
    // 8,9 user_id
    // 6 project_id

    let projectId = 1
    let userIds = [1, 2]

    for (let i = 0; i < 20; i++) {

        let message = faker.git.commitMessage()

        // let createAt = faker.date.between({ from: '2024-04-17T00:00:00.000Z', to: '2024-04-18T023:59:00.000Z' })

        let createAt = faker.date.between({ from: '2024-04-15T00:00:00.000Z', to: '2024-04-18T023:59:00.000Z' })


        await pgClient.query(`INSERT INTO messages (user_id, project_id, content, created_at) VALUES ($1, $2, $3, $4)`, [faker.helpers.arrayElement(userIds), projectId, message, createAt])


    }

    await pgClient.end()
}



fakeMessage()

// npx ts-node psql\messageSeed.ts