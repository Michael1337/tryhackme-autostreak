export const config = {
  roomUrl: 'https://tryhackme.com/room/tickets3',
  waitBeforeResetMs: 5_000,
  waitAfterResetMs: 5_000,
  waitAfterPageLoadMs: 5_000,
  selectors: {
    taskContainer: '#room_content',
    checkButton: '#room_content button[color="primary"]',
  },
  notifications: {
    enabled: true,
    provider: 'gotify',
    gotify: {
      url: 'https://gotify.michweb.de',
      token: 'AtOPyyOXaJbGGzY',
    },
    telegram: {
      botToken: '',
      chatId: ''
    }
  }
};