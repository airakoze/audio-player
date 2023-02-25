import React, {useEffect} from 'react';
import useState from 'react-usestateref'
import { Text, View, StyleSheet, Button, ActivityIndicator } from 'react-native';
import { Audio } from 'expo-av';
import Slider from '@react-native-community/slider';

export default function App() {
  const remoteAudioList = ['https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3', 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3', 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3'];
  const [soundObjList, setSoundObjList, soundObjListRef] = useState([]);
  const [currentIndex, setCurrentIndex, currentIndexRef] = useState(null);

  async function initAudio() {
    await Audio.setAudioModeAsync({
      allowsRecordingIOS: false,
      playsInSilentModeIOS: true,
      playsInSilentLockedModeIOS: true,
      shouldDuckAndroid: true,
      playThroughEarpieceAndroid: false,
      staysActiveInBackground: true,
    });

    await Promise.all(remoteAudioList.map(async (location) => await Audio.Sound.createAsync({uri: location})))
    .then((res) => {
      const currentSoundObjList = [];
      if (res) {
        res.map((soundObj) => currentSoundObjList.push({sound: soundObj.sound, position: 0, duration: soundObj.status.durationMillis, isPlaying: false}));
        setSoundObjList(currentSoundObjList);
      }
    });
  }

  useEffect(() => {
    initAudio();
  }, []);

  // Check if any sound is playing and return the sound object and its index or null
  async function isSoundPlaying() {
    let soundPlaying = null;
    const newSoundObjList = [...soundObjListRef.current];
    newSoundObjList.map((item, index) => {
      if (item.isPlaying) {
        soundPlaying = {sound: item.sound, index: index};
      }
    });
    return soundPlaying;
  }

  function changeSoundPlayingStatus(index) {
    const newSoundObjList = [...soundObjListRef.current];
    newSoundObjList[index].isPlaying = false;
    setSoundObjList(newSoundObjList);
  }

  // Checks if any sound is playing and pauses it before playing the new sound
  async function playSound(sound) {
    await isSoundPlaying()
    .then(async (soundPlaying) => {
      if (soundPlaying) {
        changeSoundPlayingStatus(soundPlaying.index);
        await pauseSound(soundPlaying.sound)
        .then(async () => {
          await sound.playAsync()
          .then(() => sound.setOnPlaybackStatusUpdate(statusUpdate));
        })
      } else {
        await sound.playAsync()
        .then(() => sound.setOnPlaybackStatusUpdate(statusUpdate));
      }
    });
  }

  async function replaySound(sound) {
    await isSoundPlaying()
    .then(async (soundPlaying) => {
      if (soundPlaying) {
        changeSoundPlayingStatus(soundPlaying.index);
        await pauseSound(soundPlaying.sound)
        .then(async () => {
          await sound.replayAsync()
          .then(() => sound.setOnPlaybackStatusUpdate(statusUpdate));
        })
      } else {
        await sound.replayAsync()
        .then(() => sound.setOnPlaybackStatusUpdate(statusUpdate));
      }
    });
  }

  async function pauseSound(sound) {
    await sound.pauseAsync()
    .then(() => {
      sound.setOnPlaybackStatusUpdate(statusUpdate);
    });
  }

  function statusUpdate(playbackStatus) {
    const newSoundObjList = [...soundObjListRef.current];
    if (newSoundObjList[currentIndexRef.current]) {
      newSoundObjList[currentIndexRef.current].position = playbackStatus.positionMillis;
      newSoundObjList[currentIndexRef.current].isPlaying = playbackStatus.isPlaying;
      setSoundObjList(newSoundObjList);
    }
  }

  function convertMilliSeconds(ms) {
    var min = Math.floor((ms / (1000 * 60)) % 60);
    var sec = Math.floor((ms / 1000) % 60);
    return min + ':' + sec;
  }

  function AudioPlayerComponent(props) {
    return (
      <>
        {
          props.isPlaying
          ?
          <Button
            title="Pause Sound"
            onPress={() => {
              setCurrentIndex(props.index);
              pauseSound(props.sound);
            }} 
          />
          :
          props.position == props.duration && props.position > 0 
            ? 
            <Button
              title="Replay Sound"
              onPress={() => {
                setCurrentIndex(props.index);
                replaySound(props.sound);
              }}
            /> 
            :
            <Button
              title="Play Sound"
              onPress={() => {
                setCurrentIndex(props.index);
                playSound(props.sound)
              }} 
            />
        }
        <Slider
          disabled={true}
          value={props.position}
          minimumValue={0}
          maximumValue={props.duration}
          minimumTrackTintColor="#537FE7"
          maximumTrackTintColor="#E9F8F9"
        />
        <Text>{convertMilliSeconds(props.position)}/{convertMilliSeconds(props.duration)}</Text>
      </>
    )
  }
  
  return (
    <View style={styles.container}>
      {
        soundObjListRef.current.length != 0
        ?
        soundObjListRef.current.map((item, index) => <AudioPlayerComponent key={index} index={index} sound={item.sound} isPlaying={item.isPlaying} position={item.position} duration={item.duration} />)
        :
        <ActivityIndicator size={"large"} color={"#537FE7"}/>
      }
    </View>
  ); 
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    padding: 10,
  },
});
