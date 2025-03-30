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
          helloMessage="Chatting with the GoHacker chatbot is a breeze! Simply type your questions or requests about GitHub repositories."
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
            const res = await fetch(
              "http://localhost:3000/analyze-github/message",
              {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                },
                body: JSON.stringify({ description: message[0].content }),
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
