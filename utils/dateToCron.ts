export function dateToCron(date) {
  const year = date.getFullYear()
  const month = date.getMonth() + 1 // Months are zero-indexed, so add 1
  const day = date.getDate()
  const hour = date.getHours()
  const minute = date.getMinutes()

  return `${minute} ${hour} ${day} ${month} * ${year}`
}
