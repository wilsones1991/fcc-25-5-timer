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

const renderTimeInput = (state, action, changedTime) => {
  
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
  if (changedTime.minutes <= 0) {
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
        'label': 'Session'
      }

    case 'increment':

      // Store new incremented time object.
      const incrementedTime = { minutes: state[actionProperty].minutes + 1, seconds: state[actionProperty].seconds }

      return (
        {
          ...renderTimeInput(state, action, incrementedTime)
        }
      )

    case 'decrement':
        
      const decrementedTime = { minutes: state[actionProperty].minutes - 1, seconds: state[actionProperty].seconds }

      return (
        {
          ...renderTimeInput(state, action, decrementedTime)
        }
      )

    case 'tick':
      let minutes = state.time.minutes
      let seconds = state.time.seconds

      if (action.playBeep) {
        beep.play()
      }
      if (seconds === "00") {
        if ((parseInt(minutes) - 1) < 10) {
          minutes = "0" + (parseInt(minutes) - 1).toString()
          seconds = "59"
        } else {
          minutes = parseInt(minutes) - 1
          seconds = "59"
        }
      } else if (parseInt(seconds) > 10) {
        seconds = parseInt(seconds) - 1
      } else {
        seconds = "0" + (parseInt(seconds) - 1)
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
        
        const minutesNumber = parseInt(action.minutes)
        const secondsNumber = parseInt(state[actionProperty].seconds)

        if (minutesNumber === 60 && secondsNumber > 0) {
          return {...state}
        }

        if (minutesNumber > 60 || isNaN(minutesNumber)) {
          return {...state}
        }

        return {...state, [actionProperty]: { 'minutes': action.minutes, 'seconds': state[actionProperty].seconds }}
    
    case 'minutesCleanup':
      return handleMinutesCleanup(state, action)
    
    case 'secondsChange':
      return handleSecondsChange(state, action)
    
    case 'secondsCleanup':
      return handleSecondsCleanup(state, action)
    default:
      throw new Error('Did not work')
  }
}

const handleSecondsChange = (state, action) => {
  
  const actionProperty = action.id + 'Length'
  const minutesNumber = parseInt(state[actionProperty].minutes)
  const secondsNumber = parseInt(action.seconds)

    if (minutesNumber === 60 && secondsNumber > 0) {
          return {...state}
    }
    if (secondsNumber < 0 || secondsNumber > 59 || isNaN(secondsNumber)) {
      return {...state}
    }

    return {...state, [actionProperty]: { 'minutes': state[actionProperty].minutes, 'seconds': action.seconds }}
}

const handleMinutesCleanup = (state, action) => {
  const actionProperty = action.id + 'Length'
  
  let updatedLength = { 'minutes': state[actionProperty].minutes, 'seconds': state[actionProperty].seconds }

  let updatedTime = { 'minutes': state.time.minutes, 'seconds': state.time.seconds}

  const updatedMinutes = state[state.countdown + 'Length'].minutes
  const updatedSeconds = state[state.countdown + 'Length'].seconds

  if (parseInt(action.minutes) === 0) {
    updatedLength = { 'minutes': "0", 'seconds': state[actionProperty].seconds }
    updatedTime = { 'minutes': "00", 'seconds': state[actionProperty].seconds }
  } else if (action.minutes.length === 1) {
    const cleanMinutes = action.minutes
    
    updatedLength = { 'minutes': cleanMinutes, 'seconds': state[actionProperty].seconds }
    updatedTime = { 'minutes': '0' + cleanMinutes, 'seconds': state[actionProperty].seconds }

  } else if (action.minutes === "" && action.id !== state.countdown) {
    updatedLength = {'minutes': '0', 'seconds': state[actionProperty].seconds}

  } else if (action.id === state.countdown && action.minutes === "") {
      updatedLength = {'minutes': '0', 'seconds': state[actionProperty].seconds}
      updatedTime = {'minutes': '00', 'seconds': state[actionProperty].seconds }
  } else {
    updatedTime = { 'minutes': updatedMinutes, 'seconds': updatedSeconds }
  }
  if (action.id === state.countdown && state.isPaused) {
    return {...state, [actionProperty]: updatedLength, 'time': updatedTime}
  } else {
    return {...state, [actionProperty]: updatedLength}
  }
}

const handleSecondsCleanup = (state, action) => {
  const actionProperty = action.id + 'Length'
  
  let updatedLength = { 'minutes': state[actionProperty].minutes, 'seconds': state[actionProperty].seconds }

  let updatedTime = { 'minutes': state.time.minutes, 'seconds': state.time.seconds}

  const updatedMinutes = state[state.countdown + 'Length'].minutes
  const updatedSeconds = state[state.countdown + 'Length'].seconds

  if (action.seconds.length === 1) {
        
    const cleanSeconds = "0" + action.seconds
    
    updatedLength = { 'minutes': state[actionProperty].minutes, 'seconds': cleanSeconds }
    updatedTime = { 'minutes': state[actionProperty].minutes, 'seconds': cleanSeconds }
    console.log(updatedTime)

  } else if (action.seconds === "" && action.id !== state.countdown) {
    
    updatedLength = {'minutes': state[actionProperty.minutes], 'seconds': '00'}
  } else if (action.id === state.countdown && action.seconds === "") {
      updatedLength = {'minutes': state[actionProperty].minutes, 'seconds': '00'}
      updatedTime = {'minutes': state[actionProperty].minutes, 'seconds': '00' }
  } else {
    updatedTime = { 'minutes': updatedMinutes, 'seconds': updatedSeconds }
  }
  
  if (action.id === state.countdown && state.isPaused) {
    if (state[actionProperty].minutes.length === 1) {
      updatedTime = { 'minutes': '0' + updatedMinutes, 'seconds': updatedSeconds }
    }

    return {...state, [actionProperty]: updatedLength, 'time': updatedTime}

  } else {
    return {...state, [actionProperty]: updatedLength}
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
      'label': 'Session'
    }
  )

  useEffect(() => {

    let interval

    if (!state.isPaused) {
      interval = setInterval(() => {
        if (state.time.minutes === '00' && state.time.seconds === '01') {
          dispatch({ type: 'tick', playBeep: true  })
        }
        else if (state.time.minutes === '00' && state.time.seconds === '00') {
          dispatch({type: 'switchCountdown'})
        } else {
          dispatch({ 'type': 'tick' })
        }
      }, 1000)
    }
    return () => clearInterval(interval)
  }, [state.isPaused, state.time.minutes, state.time.seconds])

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
          <StartStop isPaused={state.isPaused} />
          <button id="reset" name="reset" onClick={()=>dispatch({type: 'reset'})}>Reset</button>
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
      <label id={id + '-label'}>{label} Length</label>
      <div className="time-input-container">
        <input id={domid} className="minutes-input" type="text" value={time.minutes} /* onChange={(e)=>dispatch({type: 'minutesChange', 'id': id, 'minutes': e.target.value})} onBlur={(e)=>dispatch({type: 'minutesCleanup', 'id': id, 'minutes': e.target.value })} */ />
        <span>:</span>
        <input className="seconds-input" type="text" value={time.seconds} /* onChange={(e)=>dispatch({type: 'secondsChange', 'id': id, 'seconds': e.target.value})} onBlur={(e)=>dispatch({type: 'secondsCleanup', 'id': id, 'seconds': e.target.value})} */ />
      </div>
      
      <div className="arrow-container">
        <button id={id + '-increment'} onClick={()=>dispatch({type: 'increment', 'id': id})}>+</button>
        <button id={id + '-decrement'} onClick={()=>dispatch({type: 'decrement', 'id': id})}>&minus;</button>
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

const StartStop = ( { isPaused } ) => {
  
  const dispatch = useContext(TimerDispatch)

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
    <button id="start_stop" name="play-pause-button" onClick={()=> dispatch(action())} >{icon}</button>
  )
}

export default App;
