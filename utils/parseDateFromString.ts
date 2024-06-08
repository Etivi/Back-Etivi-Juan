export const parseDateFromString = (input: string) => {
  const [hour, minutes, seconds] = input
    .replace("AM", "")
    .split(":")
    .map((unity) => parseInt(unity))
  const date = new Date()
  date.setHours(date.getHours() + hour)
  date.setMinutes(date.getMinutes() + minutes)
  date.setSeconds(date.getSeconds() + seconds)
  return date
}
