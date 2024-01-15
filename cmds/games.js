const axios = require('axios');
const fs = require ('fs-extra');
const leaderBoardsData = './jsonFile/leaderBoardsData.json';

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
    event, api, Reply, message, commandName, usersData
  }) {
    const {
      threadID,
      messageID,
      body,
      senderID
    } = event;
    const userData = await usersData.get(senderID);
    const name = userData.name;
    const handleReply = Reply;
    const {
      author
    } = handleReply;
    let category = "";
    if (senderID !== Reply.author) return;

    if (handleReply.type === "category") {
      category = body.toLowerCase();
      //Leaderboards
      const boards = ["leaderboards",
        "leaderboard",
        "1",
        "[1]"];
      if (boards.some(board => category.includes(board))) {
        try {
          const leaderBoardsData = await leaderBoards();
          return message.reply(`${leaderBoardsData}`);
        } catch (error) {
          console.error(error);
          return message.reply(`Error retrieving leaderboards: ${error}`);
        }
      }
      const selection = await categorySelection(category);
      if (selection.error)
        return message.reply(`${selection.error}`);
      const {
        answer,
        question,
      } = selection;

      api.unsendMessage(handleReply.messageID, () => {
        api.sendMessage(`🔠 | You Choose: ${category}.\n\n❏  | React to this message to start.\n\n↩️ | Reply "change" or "back" to change category`, threadID, (e, info) => {
          global.GoatBot.onReaction.set(info.messageID, {
            commandName,
            category,
            messageID: info.messageID,
            author: author,
            type: "react"
          });

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
      }
    } else if (handleReply.type === "answer") {
      //====Answer
      const {
        answer,
        category
      } = handleReply;
      if (body === answer) {
        api.unsendMessage(Reply.messageID).catch(console.error);
        let trophy = Math.floor(Math.random() * 10) + 1;

        const incResult = await inc({
          id: senderID,
          name: name,
          trophy: trophy
        });

        if (incResult.success) {
          let msg = {
            body: `✅ | Your answer is correct.\n\n🏆 | Trophy added: ${trophy}\n\n❏  | React to this message to continue.`
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
          return message.reply(`Error incrementing trophy: ${incResult.msg}`);
        }
        //End Of Inc
      } else {
        let trophy = Math.floor(Math.random() * 10) + 4; // Change Value Of the trophy if you want too

        const decResult = await dec({
          id: senderID,
          name: name,
          trophy: trophy
        });

        if (decResult.success) {
          let msg = {
            body: `❌ | Your answer is wrong.\n\n🏆 | Trophy's deducted: ${trophy}.\n\n❏  | Reply to this message to play again."`
          };
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
        } else {
          console.error(`Error decrementing trophy: ${decResult.msg}`);
        }
      }
      //end of dec
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
    [1] - Leaderboard\n
    [2] - Guess The Emoji\n
    [3] - True or False\n\n
    Reply to this message with the number of the category you choose.
    `;
    return {
      message
    };
  }

  async function leaderBoards() {
    try {
        const boardData = fs.readJsonSync(leaderBoardsData, { throws: false }) || [];

        if (boardData.length === 0) {
            return "No leaderboards data available.";
        }

        // Sort boardData by trophy in descending order
        boardData.sort((a, b) => b.trophy - a.trophy);

        // Map the sorted data with player numbers
        const result = boardData.map((entry, index) => `${index + 1}. ${entry.name} - Trophy ${entry.trophy}`);

        const formattedResult = result.join('\n');

        return formattedResult;
    } catch (error) {
        console.log(error);
        throw new Error(`Error retrieving leaderboards: ${error}`);
    }
}

  async function dec( {
    id,
    name,
    trophy
  }) {
    let success = false;
    try {
      const boardData = fs.readJsonSync(leaderBoardsData, {
        throws: false
      }) || [];

      const index = boardData.findIndex(entry => entry.id === id);

      if (index === -1) {
        boardData.push({
          id,
          name,
          trophy
        });
      } else {

        if (boardData[index].trophy > 0) {
          boardData[index].trophy -= trophy;
          success = true;
        }

        if (boardData[index].name !== name) {
          console.log(`Name updated for ID ${id}: ${boardData[index].name} -> ${name}`);
          boardData[index].name = name;
        }
      }

      fs.writeJsonSync(leaderBoardsData, boardData);
      return {
        success
      };
    } catch (error) {
      const msg = `Error in dec function: ${error}`;
      return {
        msg
      };
    }
  }
  async function inc( {
    id,
    name,
    trophy
  }) {
    let success = false;
    try {
      const boardData = fs.readJsonSync(leaderBoardsData, {
        throws: false
      }) || [];

      const index = boardData.findIndex(entry => entry.id === id);

      if (index === -1) {
        boardData.push({
          id,
          name,
          trophy
        });
      } else {
        boardData[index].trophy += trophy;
        success = true;
        if (boardData[index].name !== name) {
          console.log(`Name updated for ID ${id}: ${boardData[index].name} -> ${name}`);
          boardData[index].name = name;
        }
      }

      fs.writeJsonSync(leaderBoardsData, boardData);
      return {
        success
      };
    } catch (error) {
      const msg = `Error in inc function: ${error}`;
      return {
        msg
      };
    }
  }