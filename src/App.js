import './App.css';
import React, { useEffect, useReducer, useContext } from 'react'
import beep from './audio/alarm-sound.wav'

function App() {
  return (
    <div className="App">
      <Timer />
    </div>
  );
}

const displayWarning = (warning) => {
  console.log(warning)
}

const switchCountdown = (state) => {
  
  const whichCountdown = state.countdown === "session" ? "break" : "session"
  const whichLabel = state.label === 'Session' ? 'Break' : 'Session'


  if (state[whichCountdown + 'Length'].minutes > 0 || state[whichCountdown + 'Length'].minutes < 10) {
    
    return {...state, "countdown": whichCountdown, "time": {'minutes': '0' + state[whichCountdown + "Length"].minutes, 'seconds': state[whichCountdown + "Length"].seconds} , 'label': whichLabel }
  }

  return {...state, "countdown": whichCountdown, "time": state[whichCountdown + "Length"], 'label': whichLabel }
}

const renderSeconds = (state, action) => {

  const minutes = state[action.id + 'Length'].minutes
  const isPaused = state.isPaused
  const countdown = state.countdown
  const id = action.id

  // If timer seconds are greater than 59, change to 55 and show warning message.

  if (action.seconds > 59) {
    action.seconds = '59'
    displayWarning('Number of seconds cannot exceed 59.')
  }

  if (action.seconds.length === 1) {
    action.seconds = '0' + action.seconds
  }

  if (action.seconds === '') {
    action.seconds = '00'
  }

  const changedSeconds = { 'minutes': minutes, 'seconds': action.seconds }

  if (countdown === id && isPaused) {
    return {...state, [action.id + 'Length']: changedSeconds, 'time': {'minutes': state.time.minutes, 'seconds': action.seconds}}
  }

  return {...state, [action.id + 'Length']: changedSeconds}
}

const renderMinutes = (state, action, changedTime) => {
  
  const seconds = state[action.id + 'Length'].seconds
  const isPaused = state.isPaused
  const countdown = state.countdown
  const id = action.id

  // If timer mintues equals 60 minutes, make sure seconds aren't above 0.
  if (changedTime.minutes === 60 && seconds > 0) {
    return {...state}
  }

  // Don't let timer minutes go above 60 minutes.
  if (changedTime.minutes > 60) {
    return {...state}
  }

  // Make sure the timers don't go below 0 minutes.
  if (Number(changedTime.minutes) <= 0) {
    return {...state}
  }

  // Check if we are rendering the main countdown
  if (countdown === id && isPaused) {

    // If we are then we have to add a 0 in front of the newly changed time if it's between 1 and 9 minutes
    if (changedTime.minutes > 0 && changedTime.minutes < 10) {

      return {...state, [id + 'Length']: changedTime, 'time': { 'minutes': '0' + (changedTime.minutes), 'seconds': seconds } }
    }

    // Otherwise, tine is formatted correctly as is in the main countdown timer.
    return {...state, [id + 'Length']: changedTime, 'time': changedTime }
  }

  // Otherwise, that means the user is incrementing the inactive countdown length. Therefore, we only render the control component, not the main countdown.
  return {...state, [id + 'Length']: changedTime }

}

const reducer = (state, action) => {
  
  const actionProperty = action.id + 'Length'
  const beep = document.getElementById('beep')

  switch (action.type) {
    case 'startStop':
      return {...state, isPaused: !state.isPaused}

    case 'displayZero':
      return {...state, time: { minutes: '00', seconds: '00' }}

    case 'reset':
      
      if( !beep.paused ) {
          beep.pause()
          beep.currentTime = 0
      }
    
      return {
        ...state,
        isPaused: true,
        time: {"minutes": 25, "seconds": "00"},
        sessionLength: {"minutes": 25, "seconds": "00"}, breakLength: {"minutes": 5, "seconds": "00"},
        countdown: 'session',
        label: 'Session',
        startEnabled: true
      }

    case 'increment':

      // Store new incremented time object.
      const incrementedTime = { minutes: (Number(state[actionProperty].minutes) + 1).toString(), seconds: state[actionProperty].seconds }

      return (
        {
          ...renderMinutes(state, action, incrementedTime)
        }
      )

    case 'decrement':
        
      const decrementedTime = { minutes: state[actionProperty].minutes - 1, seconds: state[actionProperty].seconds }

      return (
        {
          ...renderMinutes(state, action, decrementedTime)
        }
      )

    case 'tick':
      
      let minutes = state.time.minutes
      let seconds = state.time.seconds
        
      if (minutes === '00' && seconds === '01') {
        beep.play()
      }
      if (seconds === "00") {
        if (minutes === '00') {
          return switchCountdown(state)
        } else if ((Number(minutes) - 1) < 10) {
          minutes = "0" + (Number(minutes) - 1).toString()
          seconds = "59"
        } else {
          minutes = Number(minutes) - 1
          seconds = "59"
        }

      } else if (Number(seconds) > 10) {
        seconds = Number(seconds) - 1

      } else {
        seconds = "0" + (Number(seconds) - 1)
      }

      return { ...state, "time": { "minutes": minutes.toString(), "seconds": seconds.toString() } }

      case 'switchCountdown':
        const whichCountdown = state.countdown === "session" ? "break" : "session"
        const whichLabel = state.label === 'Session' ? 'Break' : 'Session'

        if (state[whichCountdown + 'Length'].minutes > 0 || state[whichCountdown + 'Length'].minutes < 10) {
          return {...state, "countdown": whichCountdown, "time": {'minutes': '0' + state[whichCountdown + "Length"].minutes, 'seconds': state[whichCountdown + "Length"].seconds} , 'label': whichLabel }
        }

        return {...state, "countdown": whichCountdown, "time": state[whichCountdown + "Length"], 'label': whichLabel }

      case 'minutesChange':

      let startEnabled
        if (isNaN(action.minutes)) {
          return {...state}
        }

        if (action.minutes !== '') {
          startEnabled = true
        } else {
          startEnabled = false
        }

        
        return {...state, [actionProperty]: { 'minutes': action.minutes, 'seconds': state[actionProperty].seconds }, startEnabled: startEnabled}
    
    case 'minutesCleanup':
      
      // Reformat minutes if necessary after user has finished typing in changes to minutes.

      const errWithMinutes = 'Number of minutes must be between 1 and 60.'

      if (action.minutes === '' || action.minutes < 1 || (action.minutes === 60 && state[actionProperty].length > 0)|| action.minutes > 60) {

        displayWarning(errWithMinutes)
        return {...state, startEnabled: false}
      }

      const changedTime = { 'minutes': action.minutes, 'seconds': state[actionProperty].seconds }

      return {

        ...renderMinutes(state, action, changedTime), startEnabled: true}
      
    case 'secondsChange':
      
      if (isNaN(action.seconds)) {
        return {...state}
      }
    
      return {...state, [actionProperty]: { 'minutes': state[actionProperty].minutes, 'seconds': action.seconds }}
    
    case 'secondsCleanup':
      
      return renderSeconds(state, action)

    default:
      throw new Error('Did not work')
  }
}

const TimerDispatch = React.createContext(null)

function Timer() {
  // State of all timer components
  const [state, dispatch] = useReducer(
    reducer,
    // Just initial state!
    {
      "time": {
        "minutes": 25,
        "seconds": '00'
      },
      "sessionLength": {
        "minutes": 25,
        "seconds": '00'
      },
      "breakLength": {
        "minutes": 5,
        "seconds": '00'
      },
      "isPaused": "true",
      "countdown": "session",
      'label': 'Session',
      'startEnabled': true
    }
  )

  useEffect(() => {

    let interval

    if (!state.isPaused) {
      interval = setInterval(() => {
        dispatch({ type: 'tick' })
      }, 1000)
    }

    return () => clearInterval(interval)
  }, [state.isPaused])

  return (
    <TimerDispatch.Provider value={dispatch}>
      <div className="timer">
        <h1 className="main-header">25 + 5 Timer</h1>
        <div className="session-input-container">
          <SessionInput id="session" label="Session" time={state.sessionLength} />
          <SessionInput id="break" label="Break" time={state.breakLength} />
        </div>

        <SessionCountdown countdown={state.countdown} time={state.time} label={state.label} />
        <audio id='beep' className='beep' src={beep} />

        <div className="transport-container">
          <StartStop isPaused={state.isPaused} startEnabled={state.startEnabled} />
          <button id="reset" className='reset' name="reset" onClick={()=>dispatch({type: 'reset'})}>Reset</button>
        </div>
    </div>
  </TimerDispatch.Provider>
  )
}

function SessionInput( { label, time, id }) {

  const dispatch = useContext(TimerDispatch)

  const domid = id === "session" ? "session-length" : "break-length"

  return (

    <div className="session-input">
      <label id={id + '-label'} className='label' >{label} Length</label>
      <div className="time-input-container">

        <input id={domid} className="minutes-input" type="text" placeholder='mm' value={time.minutes} onChange={(e)=>dispatch({type: 'minutesChange', 'id': id, 'minutes': e.target.value})} onBlur={(e)=>dispatch({type: 'minutesCleanup', 'id': id, 'minutes': e.target.value })} />

        <span>:</span>

        <input className="seconds-input" type="text" value={time.seconds} onChange={(e)=>dispatch({type: 'secondsChange', 'id': id, 'seconds': e.target.value})} onBlur={(e)=>dispatch({type: 'secondsCleanup', 'id': id, 'seconds': e.target.value})} />

      </div>
      
      <div className="arrow-container">
        <button id={id + '-increment'} onClick={()=>dispatch({type: 'increment', 'id': id})} className='length-button'>+</button>

        <button id={id + '-decrement'} onClick={()=>dispatch({type: 'decrement', 'id': id})} className='length-button'>&minus;</button>

      </div>
    </div>
  )
}

function SessionCountdown( { time, label } ) {

  const minutes = time.minutes
  const seconds = time.seconds

  useEffect(() => {

    const countdownContainer = document.getElementById('countdown-container')

    if ((minutes === "01" && seconds === "00") || minutes === "00") {
      countdownContainer.classList.add('warning')
    } else {
      if (countdownContainer.classList.contains('warning')) {
        countdownContainer.classList.remove('warning')
      }
    }
  }, [minutes, seconds])

  return (
    <div id="countdown-container" className="countdown-container">
      <h2 id="timer-label" className="countdown-heading">{label}</h2>
      <div id='time-left' className="countdown">{`${minutes}:${seconds}`}</div>
    </div>
  )
}

const StartStop = ( { isPaused, startEnabled } ) => {
  
  const dispatch = useContext(TimerDispatch)

  useEffect(() => {
    const startStop = document.getElementById("start_stop")
    if (!startEnabled) {
      startStop.disabled = true
      startStop.classList.add('disabled')
    } else {
      startStop.disabled = false
      startStop.classList.remove('disabled')
    }
  },[startEnabled])


  // console.log(document.getElementById("start_stop").disabled)
  let icon

  if (isPaused) {
    icon = "Start"
  } else {
    icon = "Pause"
  }

  const action = () => {
    return { type: 'startStop' }
  }

  return (
    <button id="start_stop" className="start-stop" name="play-pause-button" onClick={()=> dispatch(action())} >{icon}</button>
  )
}

export default App;
