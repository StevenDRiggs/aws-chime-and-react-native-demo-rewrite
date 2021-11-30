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


const Meeting = ({ meetingTitle, selfAttendeeId }) => {
  const [ attendees, setAttendees ] = useState([])
  const [ videoTiles, setVideoTiles ] = useState([])
  const [ mutedAttendee, setMutedAttendee ] = useState([])
  const [ selfVideoEnabled, setSelfVideoEnabled ] = useState(false)
  const [ meetingTitle, setMeetingTitle ] = useState(meetingTitle || '')
  const [ screenShareTile, setScreenShareTile ] = useState(null)

  const [ onAttendeesJoinSubscriptionHandle, setOnAttendeesJoinSubscriptionHandle ] = useState(null)
  const [ onAttendeesLeaveSubscriptionHandle, setOnAttendeesLeaveSubscriptionHandle ] = useState(null)
  const [ onAttendeesMuteSubscriptionHandle, setOnAttendeesMuteSubscriptionHandle ] = useState(null)
  const [ onAttendeesUnmuteSubscriptionHandle, setOnAttendeesUnmuteSubscriptionHandle ] = useState(null)
  const [ onAddVideoTileSubscriptionHandle, setOnAddVideoTileSubscriptionHandle ] = useState(null)
  const [ onRemoveVideoTileSubscriptionHandle, setOnRemoveVideoTileSubscriptionHandle ] = useState(null)
  const [ onErrorSubscriptionHandle, setOnErrorSubscriptionHandle ] = useState(null)

  const onAttendeesJoinSubscription = () => (
    // Attendee Join handler

    getSDKEventEmitter().addListener(
      MobileSDKEvent.OnAttendeesJoin,
      ({ attendeeId, externalUserId }) => {
        if (!(attendeeId in attendeeNameMap)) {
          // The externalUserId will be a format such as c19587e7#Alice
          attendeeNameMap[attendeeId] = externalUserId.split("#")[1]
        }

        setAttendees(oldState => oldState.concat([attendeeId]))
      }
    )
  )

  const onAttendeesLeaveSubscription = () => (
    // Attendee Leave handler

    getSDKEventEmitter().addListener(
      MobileSDKEvent.OnAttendeesLeave,
      ({ attendeeId }) => {
        setAttendees(oldState => oldState.filter((attendeeToCompare => attendeeId != attendeeToCompare)))
      }
    )
  )

  const onAttendeesMuteSubscription = () => (
    // Attendee Mute handler

    getSDKEventEmitter().addListener(
      MobileSDKEvent.OnAttendeesMute,
      (attendeeId) => {
        setMutedAttendee(oldState => oldState.concat([attendeeId]))
      }
    )
  )

  const onAttendeesUnmuteSubscription = () => (
    // Attendee Unmute handler

    getSDKEventEmitter().addListener(
      MobileSDKEvent.OnAttendeesUnmute,
      (attendeeId) => {
        setMutedAttendee(oldState => oldState.filter((attendeeToCompare => attendeeId != attendeeToCompare)))
      }
    )
  )

  const onAddVideoTileSubscription = () => (
    // Video Tile Add handler

    getSDKEventEmitter().addListener(
      MobileSDKEvent.OnAddVideoTile,
      (tileState) => {
        if (tileState.isScreenShare) {
          setScreenShareTile(tileState.tileId)
        } else {
          setVideoTiles(oldState => [oldState, tileState.tileId])
          if (tileState.isLocal) {
            setSelfVideoEnabled(true)
          }
        }
      }
    )
  )

  const onRemoveVideoTileSubscription = () => (
    // Video Tile Remove handler

    getSDKEventEmitter().addListener(
      MobileSDKEvent.OnRemoveVideoTile,
      (tileState) => {
        if (tileState.isScreenShare) {
          setScreenShareTile(null)
        } else {
          setVideoTiles(oldState => oldState.filter(tileIdToCompare => tileIdToCompare != tileState.tileId))
          if (tileState.isLocal) {
            setSelfVideoEnabled(false)
          }
        }
      }
    )
  )

  const onErrorSubscription = () => (
    getSDKEventEmitter.addListener(
      MobileSDKEvent.OnError,
      (errorType) => {
        switch(errorType) {
          case MeetingError.OnMaximumConcurrentVideoReached:
            Alert.alert("Failed to enable video", "maximum number of concurrent videos reached!")
            break
          default:
            Alert.alert("Error", errorType)
        }
      }
    )
  )

  useEffect(() => {
    const cleanup = () => {
      onAttendeesJoinSubscriptionHandle?.remove()
      setOnAttendeesJoinSubscriptionHandle(null)
      onAttendeesLeaveSubscriptionHandle?.remove()
      setOnAttendeesLeaveSubscriptionHandle(null)
      onAttendeesMuteSubscriptionHandle?.remove()
      setOnAttendeesMuteSubscriptionHandle(null)
      onAttendeesUnmuteSubscriptionHandle?.remove()
      setOnAttendeesUnmuteSubscriptionHandle(null)
      onAddVideoTileSubscriptionHandle?.remove()
      setOnAddVideoTileSubscriptionHandle(null)
      onRemoveVideoTileSubscriptionHandle?.remove()
      setOnRemoveVideoTileSubscriptionHandle(null)
      onErrorSubscriptionHandle?.remove()
      setOnErrorSubscriptionHandle(null)
    }

    setOnAttendeesJoinSubscriptionHandle(onAttendeesJoinSubscription())
    setOnAttendeesLeaveSubscriptionHandle(onAttendeesLeaveSubscription())
    setOnAttendeesMuteSubscriptionHandle(onAttendeesMuteSubscription())
    setOnAttendeesUnmuteSubscriptionHandle(onAttendeesUnmuteSubscription())
    setOnAddVideoTileSubscriptionHandle(onAddVideoTileSubscription())
    setOnRemoveVideoTileSubscriptionHandle(onRemoveVideoTileSubscription())
    setOnErrorSubscriptionHandle(onErrorSubscription())

    return cleanup
  }, [])

  const currentMuted = mutedAttendee.includes(selfAttendeeId)


  return (
    <View style={[styles.container, { justifyContent: 'flex-start' }]}>
      <Text style={styles.title}>{meetingTitle}</Text>
      <View style={styles.buttonContainer}>
        <MuteButton muted={currentMuted} onPress={() => NativeFunction.setMute(!currentMuted) }/>         
        <CameraButton disabled={selfVideoEnabled} onPress={() =>  NativeFunction.setCameraOn(!selfVideoEnabled)}/>
        <HangOffButton onPress={() => NativeFunction.stopMeeting()} />
      </View>
      <Text style={styles.title}>Video</Text>
      <View style={styles.videoContainer}>
        {
          videoTiles.length > 0 ? videoTiles.map(tileId => 
            <RNVideoRenderView style={styles.video} key={tileId} tileId={tileId} />
          ) : <Text style={styles.subtitle}>No one is sharing video at this moment</Text>
        }
      </View>
      {
        !!screenShareTile &&    
          <>
            <Text style={styles.title}>Screen Share</Text>
            <View style={styles.videoContainer}>
              <RNVideoRenderView style={styles.screenShare} key={screenShareTile} tileId={screenShareTile} />
            </View>
          </>
      }
      <Text style={styles.title}>Attendee</Text>
      <FlatList
        style={styles.attendeeList}
        data={attendees}
        renderItem={({ item }) => <AttendeeItem attendeeName={attendeeNameMap[item] ?? item} muted={mutedAttendee.includes(item)}/>}
        keyExtractor={(item) => item}
      />
    </View>
  )
}
