import React, { useState } from 'react';

import { Button, Col, Row } from 'antd';
import { capitalize } from 'lodash';
import Languages from 'services/languages/languages.js';
import Icon from 'components/Icon/Icon';
import RouterServices, { ClientStateType } from 'app/services/RouterService';
import { Collection } from 'services/CollectionsReact/Collections';
import { ChannelMemberResource, ChannelResource } from 'app/models/Channel';
import Emojione from 'app/components/Emojione/Emojione';
import UsersService from 'services/user/user.js';
import ModalManager from 'app/components/Modal/ModalManager';

type PropsType = {
  channel: ChannelResource;
};

export default ({ channel }: PropsType) => {
  const { companyId, workspaceId }: ClientStateType = RouterServices.useRouteState(
    ({ companyId, workspaceId }) => {
      return { companyId, workspaceId };
    },
  );
  const userId: string = UsersService.getCurrentUserId();
  const collectionPath: string = `/channels/v1/companies/${companyId}/workspaces/${workspaceId}/channels/${channel?.id}/members/`;
  const channelMembersCollection: Collection<ChannelMemberResource> = Collection.get(
    collectionPath,
    ChannelMemberResource,
  );

  const member: ChannelMemberResource[] = channelMembersCollection.useWatcher({ user_id: userId });
  const [isChannelMember, setIsChannelMember] = useState<boolean>(
    member[0] !== undefined && member[0].data.id === userId ? true : false,
  );

  const joinChannel = (): void => {
    const collectionPath: string = `/channels/v1/companies/${companyId}/workspaces/${workspaceId}/channels/${channel.data.id}/members/`;
    const channelMembersCollection = Collection.get(collectionPath, ChannelMemberResource);
    channelMembersCollection.insert(
      new ChannelMemberResource({
        channel_id: channel.data.id,
        user_id: userId,
        type: 'member',
      }),
    );

    return setIsChannelMember(true);
  };

  const buttonStyle: { [key: string]: string } = {
    minWidth: '42px',
    height: '25px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: isChannelMember ? 'var(--grey-dark)' : '',
    backgroundColor: isChannelMember ? 'var(--grey-background)' : 'var(--primary)',
  };

  return (
    <Row
      style={{ lineHeight: '47px' }}
      key={channel.key}
      justify="space-between"
      align="middle"
      className="x-margin"
    >
      <Col
        style={{ display: 'flex', alignItems: 'center' }}
        onClick={() => {
          if (isChannelMember) {
            ModalManager.closeAll();
            return RouterServices.history.push(`/client/${workspaceId}/c/${channel.data.id}`);
          }
        }}
      >
        <div style={{ lineHeight: 0 }}>
          <Emojione type={channel.data.icon || ''} />
        </div>
        <span className="small-x-margin">{capitalize(channel.data.name)}</span>
        {channel.data.visibility === 'private' && <Icon type="lock" />}
      </Col>
      <Col>
        <Button
          disabled={isChannelMember ? true : false}
          type={isChannelMember ? 'default' : 'primary'}
          style={buttonStyle}
          onClick={joinChannel}
        >
          {Languages.t(
            isChannelMember
              ? 'components.channelworkspacelist.button_joined'
              : 'components.channelworkspacelist.button_join',
          )}
        </Button>
      </Col>
    </Row>
  );
};