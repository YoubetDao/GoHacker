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
    content: "<p>这是一个 HTML 消息示例</p>",
  },
  {
    type: "chart",
    title: "项目评分分析",
    data: [
      { key: "创新性", value: 85 },
      { key: "可行性", value: 90 },
      { key: "技术难度", value: 75 },
      { key: "完成度", value: 95 },
      { key: "市场潜力", value: 80 },
    ],
  },
  {
    type: "html",
    content: "<p>以上是项目的各项指标评分，总体表现优秀。</p>",
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
          helloMessage="恭喜您，成为被选中的孩子！您的目标是在 **ETH Hangzhou** 中夺冠，这是一场关于创意的巅峰对决。请发挥您的创意，创造出最棒的作品吧。
          GO! Hacker! 当然，我们也会在这里给您提供所需的帮助。"
          inputAreaProps={{
            placeholder: "Send a message...",
          }}
          chatItemRenderConfig={{
            actionsRender: () => {
              return <></>;
            },

            render: (item, dom, defaultDom) => {
              if (item.originData?.role === "assistant") {
                if (item.originData.content === "...") {
                  return <div>{dom.avatar}</div>;
                }

                return (
                  <div className={styles.assistantMessage}>
                    {dom.avatar}
                    <MessageRender
                      messages={JSON.parse(item.originData?.content)}
                    />
                  </div>
                );
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

            return {
              content: new Response(JSON.stringify(mockMessages)),
              role: "assistant",
              id: data.functionCall?.result.action_id,
            };
            // return {
            //   content: new Response(JSON.stringify(mockMessages)),
            //   role: "assistant",
            // };
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
