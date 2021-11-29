/*
 * Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * SPDX-License-Identifier: MIT-0
 */


import React, { useState } from 'react';
import { View, Text, TextInput, Button, Alert } from 'react-native';

import styles from '../styles/App.StyleSheet';


const Login = ({ isLoading, onSubmit }) => {
  const [ meetingName, setMeetingName ] = useState('')
  const [ userName, setUserName ] = useState('')

  const startMeeting = () => {
    if (!meetingName || !userName) {
      Alert.alert("Meeting name and user name can not be empty");
    } else {
      onSubmit(meetingName, userName);
    }
  }

  const renderForm = () => {
    return (
      <>
        <TextInput style={styles.inputBox} placeholder="Meeting ID" onChangeText={(val) => setMeetingName(val.trim())} />
        <TextInput style={styles.inputBox} placeholder="Your Name" onChangeText={(val) => setUserName(val.trim())} />
        <Button title="Start" onPress={startMeeting} />
      </>
    )
  }

  const renderLoading = () => {
    return <Text>Loading, please wait...</Text>
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Mobile SDK Demo</Text>
      <Text style={styles.subtitle}>powered by React Native</Text>
      { !!isLoading ? renderLoading() : renderForm() }
    </View>
  )
}
