/*
 * Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * SPDX-License-Identifier: MIT-0
 */

import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, Alert } from 'react-native';

import { NativeFunction, getSDKEventEmitter, MobileSDKEvent, MeetingError } from '../utils/Bridge';
import { RNVideoRenderView } from '../components/RNVideoRenderView';
import { MuteButton } from '../components/MuteButton';
import { CameraButton } from '../components/CameraButton';
import { HangOffButton } from '../components/HangOffButton';
import { AttendeeItem } from '../components/AttendeeItem';

import styles from '../styles/App.StyleSheet';


// Maps attendee Id to attendee Name
const attendeeNameMap = {};


const Meeting = () => {
  const [ attendees, setAttendees ] = useState([])
  const [ videoTiles, setVideoTiles ] = useState([])
  const [ mutedAttendee, setMutedAttendee ] = useState([])
  const [ selfVideoEnabled, setSelfVideoEnabled ] = useState(false)
  const [ meetingTitle, setMeetingTitle ] = useState('')
  const [ screenShareTile, setScreenShareTile ] = useState(null)

  const [ onAttendeesJoinSubscription, setOnAttendeesJoinSubscription ] = useState()
  const [ onAttendeesLeaveSubscription, setOnAttendeesLeaveSubscription ] = useState()

  useEffect(() => {
    // Attendee Join and Leave handler

    setOnAttendeesJoinSubscription(getSDKEventEmitter().addListener(MobileSDKEvent.OnAttendeesJoin, ({ attendeeId, externalUserId }) => {
      if (!(attendeeId in attendeeNameMap)) {
        // The externalUserId will be a format such as c19587e7#Alice
        attendeeNameMap[attendeeId] = externalUserId.split("#")[1]
      }

      setAttendees(oldState => oldState.attendees.concat([attendeeId]))
    }))

    setOnAttendeesLeaveSubscription(getSDKEventEmitter().addListener(MobileSDKEvent.OnAttendeesLeave, ({ attendeeId }) => {
      setAttendees(oldState => oldState.attendees.filter((attendeeToCompare => attendeeId != attendeeToCompare)))
    }))

    // Attendee Mute & Unmute handler
    setOnAttendeesMuteSubscription(getSDKEventEmitter().addListener(MobileSDKEvent.OnAttendeesMute, attendeeId => {
      setMutedAttendee(oldState => oldState.mutedAttendee.concat([attendeeId]))
    }))

    setOnAttendeesUnmuteSubscription(getSDKEventEmitter().addListener(MobileSDKEvent.OnAttendeesUnmute, attendeeId => {
      setMutedAttendee(oldState => oldState.mutedAttendee.filter((attendeeToCompare => attendeeId != attendeeToCompare)))
    }))

    // Video tile Add & Remove Handler

    setOnAddVideoTileSubscription(getSDKEventEmitter().addListener(MobileSDKEvent.OnAddVideoTile, (tileState) => {
      if (tileState.isScreenShare) {
        setScreenShareTile(tileState.tileId)
      } else {
        setVideoTiles(oldState => [...oldState.videoTiles, tileState.tileId])
        setSelfVideoEnabled(oldState => tileState.isLocal ? true : oldState.selfVideoEnabled)
      }
    }))

    setOnRemoveVideoTileSubscription(getSDKEventEmitter().addListener(MobileSDKEvent.OnRemoveVideoTile, (tileState) => {
      if (tileState.isScreenShare) {
        setScreenShareTile(null)
      } else {
        setVideoTiles(oldState => oldState.videoTiles.filter(tileIdToCompare => tileIdToCompare != tileState.tileId))
        setSelfVideoEnabled(oldState => tileState.isLocal ? false : oldState.selfVideoEnabled)
      }
    }))

    /**
     * General Error handler
     */
    setOnErrorSubscription(getSDKEventEmitter().addListener(MobileSDKEvent.OnError, (errorType) => {
      switch(errorType) {
        case MeetingError.OnMaximumConcurrentVideoReached:
          Alert.alert("Failed to enable video", "maximum number of concurrent videos reached!");
        break;
        default:
          Alert.alert("Error", errorType);
        break;
      }
    }))
  }

  componentWillUnmount() {
    if (this.onAttendeesJoinSubscription) {
      this.onAttendeesJoinSubscription.remove();
    }
    if (this.onAttendeesLeaveSubscription) {
      this.onAttendeesLeaveSubscription.remove();
    }
    if (this.onAttendeesMuteSubscription) {
      this.onAttendeesMuteSubscription.remove();
    }
    if (this.onAttendeesUnmuteSubscription) {
      this.onAttendeesUnmuteSubscription.remove();
    }
    if (this.onAddVideoTileSubscription) {
      this.onAddVideoTileSubscription.remove();
    }
    if (this.onRemoveVideoTileSubscription) {
      this.onRemoveVideoTileSubscription.remove();
    }
    if (this.onErrorSubscription) {
      this.onErrorSubscription.remove();
    }
  }

  render() {
    const currentMuted = this.state.mutedAttendee.includes(this.props.selfAttendeeId);
    return (
      <View style={[styles.container, { justifyContent: 'flex-start' }]}>
      <Text style={styles.title}>{this.props.meetingTitle}</Text>
      <View style={styles.buttonContainer}>
      <MuteButton muted={currentMuted} onPress={() => NativeFunction.setMute(!currentMuted) }/>         
      <CameraButton disabled={this.state.selfVideoEnabled} onPress={() =>  NativeFunction.setCameraOn(!this.state.selfVideoEnabled)}/>
      <HangOffButton onPress={() => NativeFunction.stopMeeting()} />
      </View>
      <Text style={styles.title}>Video</Text>
      <View style={styles.videoContainer}>
      {
        this.state.videoTiles.length > 0 ? this.state.videoTiles.map(tileId => 
                                                                     <RNVideoRenderView style={styles.video} key={tileId} tileId={tileId} />
                                                                    ) : <Text style={styles.subtitle}>No one is sharing video at this moment</Text>
      }
      </View>
      {
        !!this.state.screenShareTile &&    
          <React.Fragment>
            <Text style={styles.title}>Screen Share</Text>
            <View style={styles.videoContainer}>
              <RNVideoRenderView style={styles.screenShare} key={this.state.screenShareTile} tileId={this.state.screenShareTile} />
            </View>
          </React.Fragment>
      }
      <Text style={styles.title}>Attendee</Text>
        <FlatList
          style={styles.attendeeList}
          data={this.state.attendees}
          renderItem={({ item }) => <AttendeeItem attendeeName={attendeeNameMap[item] ? attendeeNameMap[item] : item} muted={this.state.mutedAttendee.includes(item)}/>}
          keyExtractor={(item) => item}
        />
        </View>
    );
  }
}
