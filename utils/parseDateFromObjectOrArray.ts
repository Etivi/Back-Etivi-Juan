/* 
    Gives an array or object.
    If is an array, position 0 is minutes, position 1 seconds.
    If is an object, minutes -> minutes and seconds is seconds
*/

const parseDateFromObjectOrArray = (
  input: number[] | { [x: string]: string },
) => {
  let initialDelay: { minutes: number; seconds: number }
  const date = new Date()
  if (Array.isArray(input)) {
    const minutes = input[0]
    const seconds = input[1]
    initialDelay = { minutes: minutes, seconds: seconds }
  } else {
    initialDelay = {
      minutes: parseInt(input.minutes),
      seconds: parseInt(input.seconds),
    }
  }
  date.setMinutes(date.getMinutes() + initialDelay.minutes)
  date.setSeconds(date.getSeconds() + initialDelay.seconds + 5)
  return date
}

export default parseDateFromObjectOrArray
