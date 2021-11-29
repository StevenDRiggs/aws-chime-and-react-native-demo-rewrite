import React, { useEffect, useState } from 'react';
import { Alert, SafeAreaView, StatusBar, Text } from 'react-native';

import { Login } from './components/Login'
import { Meeting } from './components/Meeting'
import { createMeetingRequest } from './utils/Api';
import { getSDKEventEmitter, MobileSDKEvent, NativeFunction } from './utils/Bridge';

import { styles } from './styles/App.Stylesheet'


const App = () => {
  const [ isInMeeting, setIsInMeeting ] = useState(false)
  const [ isLoading, setIsLoading ] = useState(false)
  const [ meetingTitle, setMeetingTitle ] = useState('')
  const [ selfAttendeeId, setSelfAttendeeId ] = useState('')

  const [ onMeetingStartSubscription, setOnMeetingStartSubscription ] = useState(null)
  const [ onMeetingEndSubscription, setOnMeetingEndSubscription ] = useState(null)
  const [ onErrorSubscription, setOnErrorSubscription ] = useState(null)

  useEffect(() => {
    const cleanup = () => {
      if (onMeetingEndSubscription) {
        onMeetingEndSubscription.remove();
      }

      setOnMeetingEndSubscription(null)

      if (onMeetingStartSubscription) {
        onMeetingStartSubscription.remove();
      }

      setOnMeetingStartSubscription(null)

      if (onErrorSubscription) {
        onErrorSubscription.remove();
      }

      setOnErrorSubscription(null)
    }

    setOnMeetingStartSubscription(
      getSDKEventEmitter().addListener(MobileSDKEvent.OnMeetingStart, () => {
        setIsInMeeting(true)
        setIsLoading(false)
      })
    )

    setOnMeetingEndSubscription(
      getSDKEventEmitter().addListener(MobileSDKEvent.OnMeetingEnd, () => {
        setIsInMeeting(false)
        setIsLoading(false)
      })
    )

    setOnErrorSubscription(
      getSDKEventEmitter().addListener(MobileSDKEvent.OnError, (message) => {
        Alert.alert('SDK Error', message)
      })
    )

    return cleanup
  }, [])


  const initializeMeetingSession = (meetingName, userName) => {
    setIsLoading(true)

    createMeetingRequest(meetingName, userName)
      .then(meetingResponse => {
        setMeetingTitle(meetingName)
        setSelfAttendeeId(meetingResponse.JoinInfo.Attendee.Attendee.AttendeeId)

        NativeFunction.startMeeting(meetingResponse.JoinInfo.Meeting.Meeting, meetingResponse.JoinInfo.Attendee.Attendee)
      })
      .catch(error => {
        Alert.alert("Unable to find meeting", `There was an issue finding that meeting. The meeting may have already ended, or your authorization may have expired.\n ${error}`);

        setIsLoading(false)
      })
  }

  const renderRoute = () => (
    {isInMeeting ?
      <Meeting meetingTitle={meetingTitle} selfAttendeeId={selfAttendeeId} />
      :
      <Login isLoading={isLoading} onSubmit={(meetingName, userName) => initializeMeetingSession(meetingName, userName)} />
    }
  )


  return (
    <>
      <StatusBar />
      <SafeAreaView>
        {renderRoute()}
      </SafeAreaView>
    </>
  )
}


export default App
