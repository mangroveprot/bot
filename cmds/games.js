const axios = require('axios');

module.exports = {
  config: {
    name: "games",
    aliases: ['game'],
    version: "1.0",
    author: "ViLLAVER",
    countDown: 10,
    role: 0,
    category: "game"
  },

  onStart: async function ({
    api, event, usersData, commandName, message
  }) {
    let {
      threadID,
      messageID
    } = event;
   // let timeout = 60;
    const description = await info();

    try {
      let category = "";
      let msg = {
        body: `${description.message}`,
      };

      api.sendMessage(msg, threadID, async (error, info) => {
        let sentMessageID = info.messageID;

        global.GoatBot.onReply.set(sentMessageID, {
          type: "category",
          commandName,
          author: event.senderID,
          messageID: sentMessageID,
        });

        /*setTimeout(function () {
          api.unsendMessage(sentMessageID); // Use the stored messageID here
        }, timeout * 1000);*/
      });
    } catch (error) {
      console.error("Error Occurred:", error);
      message.reply(`${error}`);
    }
  },
  //========OnReply========
  onReply: async function ({
    event, api, Reply, message, commandName
  }) {
    const handleReply = Reply;
    const {
      author
    } = handleReply;
    let category = "";
    if (event.senderID !== Reply.author) return;

    const {
      threadID,
      messageID,
      body
    } = event;

    if (handleReply.type === "category") {
      category = body.toLowerCase();

      const selection = await categorySelection(category);
      if (selection.error)
        return message.reply(`${selection.error}`);
      const {
        answer,
        question,
      } = selection;

      api.unsendMessage(handleReply.messageID, () => {
        api.sendMessage(`You Choose ${category}. Do you wish to start or change category?\n\nReply anything to this message to start.\n\nReply "change" or "back" to change category`, threadID, (e, info) => {
          global.GoatBot.onReply.set(info.messageID, {
            commandName,
            messageID: info.messageID,
            author: author,
            answer: answer,
            question: question,
            category,
            type: "start"
          });
        }, messageID);
      });
    } else if (handleReply.type === "start") {
      let choosen = "";
      choosen = body.toLowerCase();
      const {
        question,
        answer,
        category
      } = handleReply;
      const description = await info();
      if (choosen === "back" || choosen === "change") {
        try {
          global.GoatBot.onReply.set(handleReply.messageID, {
            commandName,
            messageID: handleReply.messageID,
            author: author,
            type: "category"
          });

          api.unsendMessage(handleReply.messageID, () => {
            api.sendMessage(`${description.message}`, threadID, (e, info) => {
              global.GoatBot.onReply.set(info.messageID, {
                commandName,
                messageID: info.messageID,
                author: author,
                type: "category"
              });
            }, messageID);
          });
        }catch(error) {
          return message.reply(`${error}`)
        }
      } else {
        const msg = {
          body: `Question: ${question}\n\nPlease reply with your answer to this message.`,
        };
        api.unsendMessage(handleReply.messageID, () => {
          api.sendMessage(msg, threadID, (e, info) => {
            global.GoatBot.onReply.set(info.messageID, {
              commandName,
              category,
              messageID: info.messageID,
              author: author,
              answer,
              type: "answer"
            });
          }, messageID);
        });
      }
    } else if (handleReply.type === "answer") {
      const {
        answer,
        category
      } = handleReply;
      if (body === answer) {
        api.unsendMessage(Reply.messageID).catch(console.error);
        let msg = {
          body: `✅ | Your answer is correct.\n\nPlease react to this message to continue.`
        };
        api.unsendMessage(Reply.messageID, () => {
          api.sendMessage(msg, threadID, (e, info) => {
            global.GoatBot.onReaction.set(info.messageID, {
              commandName,
              category,
              messageID: info.messageID,
              author: author,
              type: "react"
            });
          }, messageID);
        });
      } else {

        let msg = `❎ | Your answer is incorrect.\n\nPlease react to this message to try again.`;
        api.unsendMessage(Reply.messageID, () => {
          api.sendMessage(msg, threadID, (e, info) => {
            global.GoatBot.onReaction.set(info.messageID, {
              commandName,
              category: category,
              messageID: info.messageID,
              author: author,
              type: "react"
            });
          }, messageID);
        });
      }
    } else {
      return message.reply("error");
    }
  },

  onReaction: async function ({
    api, Reaction, event, commandName, message, Reply
  }) {
    const handleReact = Reaction;
    const handleReply = Reply;
    const {
      author,
      type,
      category
    } = handleReact;
    const {
      messageID,
      threadID,
      userID
    } = event;

    if (userID !== author) return;

    if (type === "react") {
      const selection = await categorySelection(category);
      if (selection.error)
        return message.reply(`${selection.error}`);
      const {
        answer,
        question,
      } = selection;
      const msg = {
        body: `Question: ${question}\n\nPlease reply with your answer to this message.`,
      };

      api.unsendMessage(handleReact.messageID, () => {
        api.sendMessage(msg, threadID, async (error, info) => {
          let sentMessageID = info.messageID;

          global.GoatBot.onReply.set(sentMessageID, {
            commandName,
            category,
            messageID: info.messageID,
            author: author,
            answer,
            type: "answer"
          });
        }, messageID);
      });
    }
  },
};

//This Games Command and Api are Made By ViLLAVER If you want to change the api, then also on how the response return from you api. Answer and question only.
async function categorySelection(category) {

  switch (category) {
    case "emoji":
      try {
        const response = await axios.get('https://api-t86a.onrender.com/api/emojigame?prompt=getquiz');
        const emojiquiz = response.data;
        const {
          emoji,
          answer
        } = emojiquiz;
        return {
          question: emoji,
          answer
        };
      } catch (error) {
        return {
          error
        };
      }
    case "info":
      const msg = "info";
      return {
        msg,
        answer: "😔",
      };
      break;
    default:
      return {
        error: "Invalid selection. Please try again."
      };
  }
}

async function info() {
  const message = `
  ==Please Choose A Category==\n
  [1] - HeadOrTail\n
  [2] - Guess The Emoji\n
  [3] - True or False\n\n
  Reply to this message with the number of the category you choose.
  `;
  return {
    message
  };
}