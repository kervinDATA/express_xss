const request = require('supertest');
const app = require('../server'); // Ajustez le chemin selon l'emplacement de votre fichier serveur

const agent = request.agent(app);

describe('app', () => {
  describe('when authenticated', () => {
    beforeEach(async () => {
      await agent
        .post('/login')
        .send('username=randombrandon&password=randompassword');
    });

    describe('POST /messages', () => {
      describe('with non-empty content', () => {
        describe('with JavaScript code in personalWebsiteURL', () => {
          it('responds with error', async () => {
            const response = await agent
              .post('/messages')
              .send({
                content: 'Test content',
                personalWebsiteURL: 'javascript:alert("XSS")',
              });

            expect(response.status).toBe(400);
            expect(response.body.errors).toHaveProperty(
              'personalWebsiteURL',
              'URL must be a valid HTTP URL starting with http:// or https://'
            );
          });
        });

        describe('with HTTP URL in personalWebsiteURL', () => {
          it('responds with success', async () => {
            const response = await agent
              .post('/messages')
              .send({
                content: 'Test content',
                personalWebsiteURL: 'http://example.com',
              });

            expect(response.status).toBe(201);
            expect(response.body.messages).toEqual(
              expect.arrayContaining([
                expect.objectContaining({
                  content: 'Test content',
                  personalWebsiteURL: 'http://example.com',
                }),
              ])
            );
          });
        });
      });
    });
  });
});
