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

// 模拟数据 - 使用类型定义确保类型正确
const mockMessages: Array<HtmlMessage | ChartMessage> = [
  {
    type: "html",
    content: "<p>This is an example of an HTML message</p>",
  },
  {
    type: "chart",
    title: "Project Score Analysis",
    data: [
      { key: "Innovation", value: 85 },
      { key: "Feasibility", value: 90 },
      { key: "Technical Complexity", value: 75 },
      { key: "Completion", value: 95 },
      { key: "Market Potential", value: 80 },
    ],
  },
  {
    type: "html",
    content:
      "<p>Above are the project's key metrics scores. Overall performance is excellent.</p>",
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
                  return (
                    <div className={styles.assistantMessage}>
                      {dom.avatar}
                      <MessageRender
                        messages={JSON.parse(item.originData?.content)}
                      />
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

            if (data.functionCall?.fn_name === "analyze_project") {
              return {
                content: new Response(JSON.stringify(mockMessages)),
                role: "assistant-analyzer",
                id: data.functionCall?.result.action_id,
              };
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
