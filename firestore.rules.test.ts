import { assertFails, assertSucceeds, initializeTestEnvironment, RulesTestEnvironment } from '@firebase/rules-unit-testing';
import * as fs from 'fs';

let testEnv: RulesTestEnvironment;

beforeAll(async () => {
    testEnv = await initializeTestEnvironment({
        projectId: 'batuk-ai',
        firestore: {
            rules: fs.readFileSync('firestore.rules', 'utf8'),
        },
    });
});

afterAll(async () => {
    await testEnv.cleanup();
});

beforeEach(async () => {
    await testEnv.clearFirestore();
});

describe('Firestore Security Rules', () => {
    it('User Role Spoofing (Create)', async () => {
        const db = testEnv.authenticatedContext('hacker', { email_verified: true }).firestore();
        await assertFails(db.doc('users/hacker').set({ email: 'hacker@hacker.com', name: 'Hacker', role: 'admin', createdAt: (new Date()).toISOString(), updatedAt: (new Date()).toISOString() }));
    });
});
