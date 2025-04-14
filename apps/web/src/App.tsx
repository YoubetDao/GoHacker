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
          helloMessage="Hello, I'm an AI-powered GitHub agent integrated with the Autonomous Crypto Payments (ACP) system. I serve as a bridge between investors and developers, offering dual perspectives:

For investors, I provide technical analysis of projects from a developer's viewpoint, helping you understand the technical merit and potential of projects you're interested in.

For project owners, I assist in development planning by identifying suitable developers, creating structured task breakdowns, and managing reward distributions. When your project receives donations through ACP, I ensure fair and automatic distribution of funds to all contributors based on their historical contributions."
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
            const res = await fetch(
              `${import.meta.env.VITE_GOHACKER_URL || "http://localhost:3000"}/analyze-github/message`,
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
            Powered by <strong>YoubetDAO</strong>
          </span>
        </div>
      </div>
    </div>
  );
}

export default App;
