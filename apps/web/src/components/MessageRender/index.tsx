import parse from "html-react-parser";
import { RadarChart } from "../RadarChart";
import styles from "./index.module.less";
import { useRef } from "react";
import html2pdf from "html2pdf.js";
import { DownloadOutlined } from "@ant-design/icons";
import { Button, message } from "antd";

interface Props {
  messages: Array<HtmlMessage | ChartMessage>;
}

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

export const MessageRender = ({ messages }: Props) => {
  const contentRef = useRef<HTMLDivElement>(null);
  
  // 下载 PDF 的函数
  const handleDownloadPDF = () => {
    if (!contentRef.current) return;
    
    // 显示加载消息
    message.loading({
      content: '正在生成 PDF 文件...',
      key: 'pdfDownload',
      duration: 0,
    });
    
    const element = contentRef.current;
    const opt = {
      margin: [10, 10, 10, 10],
      filename: '项目分析报告.pdf',
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
    };
    
    // 生成 PDF
    html2pdf()
      .set(opt)
      .from(element)
      .save()
      .then(() => {
        // 成功后显示消息
        message.success({
          content: 'PDF 文件已生成！',
          key: 'pdfDownload',
          duration: 2,
        });
      })
      .catch((error: unknown) => {
        console.error('PDF 生成错误:', error);
        message.error({
          content: 'PDF 生成失败，请重试',
          key: 'pdfDownload',
          duration: 2,
        });
      });
  };
  
  return (
    <div className={styles.messageContainer}>
      <div className={styles.messageHeader}>
        <h2 className={styles.messageTitle}>项目分析报告</h2>
        <Button 
          type="primary" 
          icon={<DownloadOutlined />} 
          onClick={handleDownloadPDF}
          className={styles.downloadButton}
        >
          下载 PDF
        </Button>
      </div>
      <div className={styles.messageContent} ref={contentRef}>
        {messages.map((message, index) => {
          switch (message.type) {
            case "html":
              return (
                <div key={`html-${index}`}>
                  <div className={styles.htmlMessage}>
                    {parse(message.content)}
                  </div>
                </div>
              );
            case "chart":
              return (
                <div
                  key={`chart-${message.title}-${index}`}
                  className={styles.chartContainer}
                >
                  <h3 className={styles.chartTitle}>{message.title}</h3>
                  <div className={styles.chartWrapper}>
                    <RadarChart data={message.data} />
                  </div>
                </div>
              );
            default:
              return null;
          }
        })}
      </div>
    </div>
  );
};
