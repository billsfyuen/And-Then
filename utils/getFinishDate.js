export function getFinishDate (startDate, durationInDay) {
    let date = new Date(startDate);
  
    date.setDate(date.getDate() + durationInDay);
  
    let year = date.getFullYear();
    let month = String(date.getMonth() + 1).padStart(2, '0');
    let day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}