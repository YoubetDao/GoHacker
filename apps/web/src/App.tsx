import { ProChat } from "@ant-design/pro-chat";
import { GithubOutlined } from "@ant-design/icons";
import "./App.css";
import styles from "./index.module.less";
import { MessageRender } from "./components/MessageRender";

// 导入消息类型定义
type HtmlMessage = {
  type: "html";
  content: string;
};

type ChartMessage = {
  type: "chart";
  title: string;
  data: Array<{
    key: string;
    value: number;
  }>;
};

const errorMessages: Array<HtmlMessage | ChartMessage> = [
  {
    type: "html",
    content:
      "<p>Some error happened, please make sure your project is in our analyze list.</p>",
  },
];

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
          helloMessage="Hello! I’m an AI-powered GitHub agent built by [wfnuser](https://x.com/wfnuser).
	•	For investors: I offer technical insights into open-source projects to help evaluate their real potential.
	•	For project owners: I assist with developer matching, task planning, and fair reward distribution based on contribution history.."
          inputAreaProps={{
            placeholder: "Send a message...",
          }}
          chatItemRenderConfig={{
            actionsRender: () => {
              return <></>;
            },

            render: (item, dom, defaultDom) => {
              if (item.originData?.role.includes("assistant")) {
                console.log(item.originData.role);

                if (item.originData.content === "...") {
                  return <div>{dom.avatar}</div>;
                }

                if (item.originData.role.includes("assistant-analyzer")) {
                  const parsedContent = JSON.parse(item.originData?.content);
                  console.log("Parsed content:", parsedContent);
                  // 添加排行榜链接
                  parsedContent.push({
                    type: "html",
                    content: `<p>Check the all projects leaderboard here: <a href='https://deepflow-hip.vercel.app/' target='_blank'>Leaderboard</a></p>`,
                  });
                  return (
                    <div className={styles.assistantMessage}>
                      {dom.avatar}
                      <MessageRender messages={parsedContent} />
                    </div>
                  );
                }

                return <div className={styles.userMessage}>{defaultDom}</div>;
              }
              return defaultDom; // 对于非助手消息，返回原始 DOM
            },
          }}
          request={async (message) => {
            const userMessages = message.filter((msg) => msg.role === "user");
            const latestUserMessage = userMessages[userMessages.length - 1];
            const res = await fetch(`/api/analyze-github/message`, {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                description: latestUserMessage.content,
              }),
            });
            const data = await res.json();
            if (data.functionCall?.fn_name === "analyze_project") {
              const feedbackMessage =
                data.functionCall?.result.feedback_message;
              try {
                const parsed = JSON.parse(feedbackMessage);
                return {
                  content: new Response(JSON.stringify(parsed)),
                  role: "assistant-analyzer",
                  id: data.functionCall?.result.action_id,
                };
              } catch (e) {
                return {
                  content: new Response(JSON.stringify(errorMessages)),
                  role: "assistant-analyzer",
                  id: data.functionCall?.result.action_id,
                };
              }
            }

            return {
              content: new Response(data.message),
              role: "assistant",
              id: data.functionCall?.result.action_id,
            };
          }}
        />

        <div className={styles.chatFooter}>
          <span className={styles.poweredBy}>
            Supported by{" "}
            <a href="https://according.work" target="_blank">
              According.Work
            </a>
          </span>
        </div>
      </div>
    </div>
  );
}

export default App;
