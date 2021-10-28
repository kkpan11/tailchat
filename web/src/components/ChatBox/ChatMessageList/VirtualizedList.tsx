import DynamicSizeList, {
  OnScrollInfo,
} from '@/components/DynamicVirtualizedList/DynamicSizeList';
import { Divider } from 'antd';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import AutoSizer from 'react-virtualized-auto-sizer';
import {
  ChatMessage,
  getMessageTimeDiff,
  shouldShowMessageTime,
  useUpdateRef,
} from 'tailchat-shared';
import { ChatMessageItem } from './Item';

// Reference: https://github.com/mattermost/mattermost-webapp/blob/master/components/post_view/post_list_virtualized/post_list_virtualized.jsx

const OVERSCAN_COUNT_BACKWARD = 80;
const OVERSCAN_COUNT_FORWARD = 80;

const postListStyle = {
  padding: '14px 0px 7px',
};

const virtListStyles: React.CSSProperties = {
  position: 'absolute',
  bottom: 0,
  maxHeight: '100%',
};

const dynamicListStyle: React.CSSProperties = {}; // TODO

function findMessageIndexWithId(
  messages: ChatMessage[],
  messageId: string
): number {
  return messages.findIndex((m) => m._id === messageId);
}

export interface VirtualizedMessageListProps {
  messages: ChatMessage[];
  onUpdateReadedMessage: (lastMessageId: string) => void;
}
export const VirtualizedMessageList: React.FC<VirtualizedMessageListProps> =
  React.memo((props) => {
    const listRef = useRef<DynamicSizeList>(null);
    const postListRef = useRef<HTMLDivElement>(null);
    const [isBottom, setIsBottom] = useState(true);

    const onScroll = (info: OnScrollInfo) => {
      if (info.clientHeight + info.scrollOffset === info.scrollHeight) {
        // 当前滚动条位于底部
        setIsBottom(true);
        props.onUpdateReadedMessage(
          props.messages[props.messages.length - 1]._id
        );
      }
    };

    const onUpdateReadedMessageRef = useUpdateRef(props.onUpdateReadedMessage);
    useEffect(() => {
      if (props.messages.length === 0) {
        return;
      }

      if (postListRef.current?.scrollTop === 0) {
        // 当前列表在最低
        onUpdateReadedMessageRef.current(
          props.messages[props.messages.length - 1]._id
        );
      }
    }, [props.messages.length]);

    const initScrollToIndex = () => {
      return {
        index: 0,
        position: 'end',
      };
    };

    /**
     * 渲染列表元素
     */
    const renderRow = ({ data, itemId }: any) => {
      const messages = props.messages;
      const index = findMessageIndexWithId(messages, itemId); // TODO: 这里是因为mattermost的动态列表传的id因此只能这边再用id找回，可以看看是否可以优化
      if (index === -1) {
        return <div />;
      }

      const message = messages[index];

      let showDate = true;
      let showAvatar = true;
      const messageCreatedAt = new Date(message.createdAt ?? '');
      if (index > 0) {
        // 当不是第一条数据时

        // 进行时间合并
        const prevMessage = messages[index - 1];
        if (
          !shouldShowMessageTime(
            new Date(prevMessage.createdAt ?? ''),
            messageCreatedAt
          )
        ) {
          showDate = false;
        }

        // 进行头像合并(在同一时间块下 且发送者为同一人)
        if (showDate === false) {
          showAvatar = prevMessage.author !== message.author;
        }
      }

      return (
        <div key={message._id} data-debug={JSON.stringify(index)}>
          {showDate && (
            <Divider className="text-sm opacity-40 px-6 font-normal select-none">
              {getMessageTimeDiff(messageCreatedAt)}
            </Divider>
          )}
          <ChatMessageItem showAvatar={showAvatar} payload={message} />
        </div>
      );
    };

    // 初始渲染范围
    const initRangeToRender = useMemo(
      () => [props.messages.length - 50, props.messages.length - 1],
      []
    );

    return (
      <AutoSizer>
        {({ height, width }) => (
          <DynamicSizeList
            ref={listRef}
            height={height}
            width={width}
            itemData={props.messages.map((m) => m._id).reverse()}
            overscanCountForward={OVERSCAN_COUNT_FORWARD}
            overscanCountBackward={OVERSCAN_COUNT_BACKWARD}
            onScroll={onScroll}
            initScrollToIndex={initScrollToIndex}
            canLoadMorePosts={() => {}}
            innerRef={postListRef}
            style={{ ...virtListStyles, ...dynamicListStyle }}
            innerListStyle={postListStyle}
            initRangeToRender={initRangeToRender}
            // loaderId={PostListRowListIds.OLDER_MESSAGES_LOADER}
            correctScrollToBottom={isBottom}
          >
            {renderRow}
          </DynamicSizeList>
        )}
      </AutoSizer>
    );
  });
VirtualizedMessageList.displayName = 'VirtualizedMessageList';
