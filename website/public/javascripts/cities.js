var cities = ["Cairo", 
"Alexandria",
"Al Jīzah",
"Ismailia",
"Port Said",
"Luxor",
"Sūhāj",
"Al Manşūrah",
"Suez",
"Al Minyā",
"Ib‘ādīyat Damanhūr",
"Banī Suwayf",
"Asyūţ",
"Ţanţā",
"Al Fayyūm",
"Aswān",
"Qinā",
"Mallawī",
"Al ‘Arīsh",
"Banhā",
"Ma‘şarat Samālūţ",
"Kafr ash Shaykh",
"Jirjā",
"Marsá Maţrūḩ",
"Isnā",
"Banī Mazār",
"Al Khārijah",
"Būr Safājah",
"Aţ Ţūr",
"Sīwah",
"Aḑ Ḑab‘ah",
"Al ‘Alamayn",
"As Sallūm",
"Qaşr al Farāfirah",
"Al Qaşr",
"Al Ghardaqah",
"Bi’r al ‘Abd",
"Rafaḩ",
"Damanhūr",
"Shibīn al Kawm",
"Damietta",
"Ash Shaykh Zuwayd",
"Az Zaqāzīq"]

var citiesHtml = ""
for (var i=0; i<cities.length; i++) {
  citiesHtml += '<option value="' + cities[i] + '">' + cities[i] + '</option>'
}

document.getElementById('city').innerHTML = citiesHtml