// Lägg till en post i series för varje serie som laget spelar i.
// Lämna url tom för att visa serienamnet utan länk.
/** @type {{ id: string, name: string, series: { id: string, name: string, url: string }[] }[]} */
const teamData = [
  {
    id: '1',
    name: 'Roslagens BWK 1',
    series: [
      {
        id: '1',
        name: 'Roslagsligan division 1',
        url: 'https://www.sbhf.se/ligaservice/index.php/serie/index?parentId=9445',
      },
    ],
  },
  {
    id: '2',
    name: 'Roslagens BWK 2',
    series: [
      {
        id: '2',
        name: 'Roslagsligan division 2',
        url: 'https://www.sbhf.se/ligaservice/index.php/serie/index?parentId=9447',
      },
    ],
  },
]

export default teamData
