import { ProChat } from "@ant-design/pro-chat";
import { GithubOutlined } from "@ant-design/icons";
import "./App.css";
import styles from "./index.module.less";

function App() {
  return (
    <div className={styles.container}>
      <div className={styles.chatbox}>
        <div className={styles.chatHeader}>
          <div className={styles.chatTitle}>
            <span className={styles.chatIcon}>💬</span> Chatbot
          </div>
          <div className={styles.chatControls}>
            <GithubOutlined className={styles.controlIcon} />
          </div>
        </div>

        <ProChat
          locale="en-US"
          className={styles.chat}
          helloMessage="恭喜您，成为被选中的孩子！您的目标是在 **ETH Hangzhou** 中夺冠，这是一场关于创意的巅峰对决。请发挥您的创意，创造出最棒的作品吧。
          GO! Hacker! 当然，我们也会在这里给您提供所需的帮助。"
          inputAreaProps={{
            placeholder: "Send a message...",
          }}
          chatItemRenderConfig={{
            actionsRender: (item, defaultDom) => {
              return <></>;
            },
            render: (item, dom, defaultDom) => {
              if (item.originData?.role === "assistant") {
                return <div className={styles.userMessage}>{defaultDom}</div>;
              }
            },
          }}
          request={async (message) => {
            const userMessages = message.filter((msg) => msg.role === "user");
            const latestUserMessage = userMessages[userMessages.length - 1];
            const res = await fetch(
              "http://localhost:3000/analyze-github/message",
              {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                },
                body: JSON.stringify({
                  description: latestUserMessage.content,
                }),
              }
            );
            const data = await res.json();

            console.log("response", data);

            return {
              content: new Response(data.message),
              role: "assistant",
              id: data.functionCall?.result.action_id,
            };
          }}
        />

        <div className={styles.chatFooter}>
          <span className={styles.poweredBy}>
            Powered by <strong>YoubetDAO</strong>
          </span>
        </div>
      </div>
    </div>
  );
}

export default App;
