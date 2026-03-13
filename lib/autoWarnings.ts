export type WarningRuleInput = {
  method: string | null
  target_pest: string | null
}

type GeneratedWarningsResult = {
  warnings: string[]
  tasks: string[]
}

function normalize(value: string | null | undefined) {
  return (value || '').trim().toLowerCase()
}

function unique(items: string[]) {
  return [...new Set(items.map((item) => item.trim()).filter(Boolean))]
}

export function generateAutoWarnings(
  rows: WarningRuleInput[]
): GeneratedWarningsResult {
  const warnings: string[] = []
  const tasks: string[] = []

  for (const row of rows) {
    const pest = normalize(row.target_pest)
    const method = normalize(row.method)

    // --- Kártevő alapú szabályok ---
    if (pest === 'csótány') {
      warnings.push(
        'A kezelt felületeket a hatás kifejlődéséig ne mossák le.'
      )
      tasks.push(
        'Az ételmaradékokat, morzsákat és zsíros szennyeződéseket rendszeresen el kell távolítani.',
        'A vizes helyiségekben a csöpögéseket és nedvesedést meg kell szüntetni.'
      )
    }

    if (pest === 'ágyi poloska') {
      warnings.push(
        'A kezelés után átmenetileg fokozódhat a poloskaaktivitás.',
        'A fertőzött helyiségből tárgyat más helyiségbe átvitel előtt ellenőrizni kell.'
      )
      tasks.push(
        'Az ágyneműt, huzatokat és textíliákat legalább 60 °C-on kell mosni.',
        'Az ágy környezetét és a rések területét rendszeresen porszívózni kell.',
        'Kontroll kezelés 10–14 napon belül javasolt.'
      )
    }

    if (pest === 'hangya') {
      warnings.push(
        'A kihelyezett irtószert ne távolítsák el a teljes hatás kialakulásáig.'
      )
      tasks.push(
        'Az élelmiszerforrásokat zártan kell tárolni.',
        'A bejutási pontokat és repedéseket célszerű lezárni.'
      )
    }

    if (pest === 'pók') {
      warnings.push(
        'A kezelt felületeket a hatástartam megőrzése érdekében ne mossák le azonnal.'
      )
      tasks.push(
        'A pókhálókat a kezelés után, a technikus javaslata alapján célszerű eltávolítani.',
        'A kültéri lámpák és nyílászárók környezetét rendszeresen ellenőrizni kell.'
      )
    }

    if (pest === 'darázs') {
      warnings.push(
        'A kezelt fészek közelítése a technikus utasítása nélkül nem javasolt.',
        'A kezelés után rövid ideig még lehet mozgás a fészek környezetében.'
      )
      tasks.push(
        'A fészek környezetét gyermekektől és háziállatoktól távol kell tartani.',
        'A későbbi visszatelepülés megelőzéséhez a bejutási pontokat ellenőrizni kell.'
      )
    }

    if (pest === 'légy') {
      warnings.push(
        'A kezelt felületekhez a szer megszáradásáig ne érjenek hozzá.'
      )
      tasks.push(
        'A hulladéktárolókat zártan kell tartani.',
        'A szerves szennyeződéseket és lerakódásokat rendszeresen el kell távolítani.'
      )
    }

    if (pest === 'bolha') {
      warnings.push(
        'A kezelés után átmenetileg fokozódhat az aktivitás, ez a szer hatásmechanizmusából adódhat.'
      )
      tasks.push(
        'A textíliákat és fekhelyeket rendszeresen tisztítani kell.',
        'A porszívózást a technikus által megadott időpontban célszerű elvégezni.'
      )
    }

    if (pest === 'rágcsáló' || pest === 'egér' || pest === 'patkány') {
      warnings.push(
        'A kihelyezett csalétket, etetőládát vagy csapdát elmozdítani tilos.',
        'Gyermekek és háziállatok a kihelyezett pontokhoz ne férjenek hozzá.'
      )
      tasks.push(
        'Az élelmiszereket és takarmányt zárt tárolóban kell tartani.',
        'A bejutási réseket, nyílásokat és kábeláttöréseket le kell zárni.',
        'Utóellenőrzés 7–14 napon belül javasolt.'
      )
    }

    if (pest === 'rovar') {
      warnings.push(
        'A kezelt felületeket a technikus által megadott ideig ne tisztítsák le.'
      )
      tasks.push(
        'A higiéniai állapot fenntartása és a táplálékforrások megszüntetése szükséges.'
      )
    }

    // --- Technika alapú szabályok ---
    if (method === 'permetezés') {
      warnings.push(
        'A kezelt felületekhez a permet megszáradásáig ne érjenek hozzá.'
      )
      tasks.push(
        'A helyiséget használat előtt alaposan ki kell szellőztetni.',
        'A kezelt sávokat a hatástartam érdekében ne mossák fel azonnal.'
      )
    }

    if (method === 'hidegköd képzés') {
      warnings.push(
        'A kezelés alatt és közvetlenül utána a helyiségben tartózkodni nem szabad.'
      )
      tasks.push(
        'A kezelés után alapos szellőztetés szükséges.',
        'A technikus által megadott várakozási idő leteltéig a helyiség ne legyen használatban.'
      )
    }

    if (method === 'ulv') {
      warnings.push(
        'Az ULV kezelés után a helyiséget csak a technikus által megadott idő elteltével szabad használni.'
      )
      tasks.push(
        'A kezelés után alapos szellőztetés szükséges.'
      )
    }

    if (method === 'gél kihelyezés') {
      warnings.push(
        'A kihelyezett gélt eltávolítani vagy letörölni tilos.'
      )
      tasks.push(
        'A gélezett pontok környezetét ne takarítsák le a hatás kialakulásáig.'
      )
    }

    if (method === 'csalianyag kihelyezés') {
      warnings.push(
        'A kihelyezett csalianyagot elmozdítani vagy eltávolítani tilos.'
      )
      tasks.push(
        'A kihelyezett pontokat hozzáférhetően kell hagyni az ellenőrzésekhez.'
      )
    }

    if (method === 'porozás') {
      warnings.push(
        'A kijuttatott por eltávolítása csökkenti a kezelés hatékonyságát.'
      )
      tasks.push(
        'A porozott rések és zugok bolygatása kerülendő.'
      )
    }

    if (method === 'fertőtlenítés') {
      warnings.push(
        'A fertőtlenített felületeket a behatási idő lejárta előtt ne töröljék le.'
      )
      tasks.push(
        'A kezelést követően a technológiai előírás szerinti szellőztetés szükséges.'
      )
    }

    if (method === 'monitorozás') {
      warnings.push(
        'A kihelyezett monitorokat elmozdítani tilos.'
      )
      tasks.push(
        'A monitorok helyét szabadon kell hagyni az ellenőrzésig.'
      )
    }

    // --- Kombinált szabályok ---
    if (pest === 'csótány' && method === 'gél kihelyezés') {
      warnings.push(
        'A gél hatásának kialakulásához idő szükséges, az első napokban még észlelhető lehet csótány.'
      )
      tasks.push(
        'A konyhai és vizesblokki higiénia fokozott fenntartása szükséges.'
      )
    }

    if (pest === 'ágyi poloska' && method === 'permetezés') {
      warnings.push(
        'Az ágyi poloska elleni kezelés jellemzően ismétlést is igényelhet.'
      )
      tasks.push(
        'A fekhely környezetét minimalizálni kell, a felesleges tárgyakat célszerű eltávolítani.'
      )
    }

    if (
      (pest === 'rágcsáló' || pest === 'egér' || pest === 'patkány') &&
      method === 'csalianyag kihelyezés'
    ) {
      warnings.push(
        'Elhullott rágcsáló előfordulhat nehezen hozzáférhető helyen is.'
      )
      tasks.push(
        'Az ellenőrzést ismételten el kell végezni a kihelyezett pontokon.'
      )
    }
  }

  return {
    warnings: unique(warnings),
    tasks: unique(tasks),
  }
}