/*
 * Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * SPDX-License-Identifier: MIT-0
 */


import React from 'react'
import {TouchableOpacity, Image} from 'react-native'

import styles from '../styles/App.StyleSheet'


let mutedImg = require('../assets/microphone-muted.png');
let normalImg = require('../assets/microphone.png');


const MuteButton = ({muted, onPress}) => {
  return (  
  <TouchableOpacity 
    onPress={() => {
      onPress();
  }}>
    <Image
      style={styles.meetingButton}
      source={muted ? mutedImg : normalImg}
    />
  </TouchableOpacity>
  ) 
}


export default MuteButton
