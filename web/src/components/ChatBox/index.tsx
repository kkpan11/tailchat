import React, { useRef } from 'react';
import { ChatBoxContextProvider, useConverseMessage } from 'tailchat-shared';
import { AlertErrorView } from '../AlertErrorView';
import { ChatBoxPlaceholder } from './ChatBoxPlaceholder';
import { ChatInputBox } from './ChatInputBox';
import { ChatMessageList } from './ChatMessageList';
import { ChatReply } from './ChatReply';
import { useMessageAck } from './useMessageAck';

type ChatBoxProps =
  | {
      converseId: string;
      isGroup: false;
      groupId?: string;
    }
  | {
      converseId: string;
      isGroup: true;
      groupId: string;
    };
const ChatBoxInner: React.FC<ChatBoxProps> = React.memo((props) => {
  const { converseId, isGroup } = props;
  const { messages, loading, error, handleSendMessage } = useConverseMessage({
    converseId,
    isGroup,
  });
  const { updateConverseAck } = useMessageAck(converseId, messages);

  if (loading) {
    return <ChatBoxPlaceholder />;
  }

  if (error) {
    return <AlertErrorView error={error} />;
  }

  return (
    <div className="w-full h-full flex flex-col select-text">
      <ChatMessageList
        messages={messages}
        onUpdateReadedMessage={updateConverseAck}
      />

      <ChatReply />

      <ChatInputBox
        onSendMsg={(msg) => {
          handleSendMessage({
            converseId: props.converseId,
            groupId: props.groupId,
            content: msg,
          });
        }}
      />
    </div>
  );
});
ChatBoxInner.displayName = 'ChatBoxInner';

export const ChatBox: React.FC<ChatBoxProps> = React.memo((props) => {
  return (
    <ChatBoxContextProvider>
      <ChatBoxInner {...props} />
    </ChatBoxContextProvider>
  );
});
ChatBox.displayName = 'ChatBox';
