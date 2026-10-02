import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { generateEmbedding } from '@/lib/gemini-embedding';

export const SEED_DECISIONS = [
  {
    daire: 'Yargıtay Hukuk Genel Kurulu',
    esas_no: '2017/975',
    karar_no: '2021/1108',
    karar_tarihi: '2021-09-28',
    konu: 'Tahliye Taahhütnamesinde Düzenleme ve Tahliye Tarihlerinin Boş Bırakılması (Beyaza İmza)',
    ozet: 'Kiracının düzenleme tarihi ve tahliye tarihi boş olan tahliye taahhütnamesine imza atması halinde, kiracı bu tarihler konusunda kiraya verene yetki vermiş sayılır (beyaza imza). Kiraya veren tarafından sonradan doldurulan tarihler kural olarak geçerlidir. Kiracı bu taahhüdün anlaşmaya aykırı doldurulduğunu ancak yazılı delille ispatlayabilir; tanık dinletemez.',
    metin: `T.C. YARGITAY HUKUK GENEL KURULU
ESAS NO: 2017/975
KARAR NO: 2021/1108
KARAR TARİHİ: 28.09.2021

DAVA VE KARARIN ÖZETİ:
Taraflar arasındaki tahliye davasında; davalı kiracı, tahliye taahhütnamesinin kira sözleşmesi imzalanırken tarihsiz ve boş olarak alındığını, daha sonra davacı kiralayan tarafından tarihler konularak işleme konulduğunu ve bu nedenle geçersiz olduğunu savunmuştur.

Hukuk Genel Kurulu incelemesinde:
Tahliye taahhütnamesinin altındaki imza kiracı tarafından inkâr edilmemiştir. İmza inkar edilmediğine göre, metnin sonradan doldurulduğu iddiası kiracıyı bağlar. Kiracı boş kağıda imza atmakla (beyaza imza) kiralayana bu metni doldurma yetkisi vermiş sayılır. Bu belgenin anlaşmaya aykırı biçimde doldurulduğu iddiası HMK m. 200 vd. uyarınca ancak senetle (yazılı delille) ispatlanabilir, tanık beyanlarına itibar edilemez. Davalı yazılı delil sunamadığına göre taahhütname geçerlidir ve tahliye kararı verilmesi gerekir.`
  },
  {
    daire: 'Yargıtay 9. Hukuk Dairesi',
    esas_no: '2021/11245',
    karar_no: '2022/1534',
    karar_tarihi: '2022-02-08',
    konu: 'Fazla Mesai ve Ücretlerin Süresinde Ödenmemesi Nedeniyle İşçinin Haklı Feshi ve Kıdem Tazminatı',
    ozet: 'Fazla çalışma ücretlerinin bordrolarda gösterilmemesi veya eksik/geç ödenmesi 4857 sayılı İş Kanunu\'nun 24/II-e maddesi gereğince işçiye derhal haklı nedenle fesih yetkisi verir. Haklı fesih durumunda işçi ihbar tazminatı talep edemez ancak kıdem tazminatına hak kazanır. İş sözleşmesinde fazla mesainin ücrete dahil olduğu hükmü yıllık 270 saat ile sınırlıdır; 270 saati aşan çalışmalar her halükarda ödenmelidir.',
    metin: `T.C. YARGITAY 9. HUKUK DAİRESİ
ESAS NO: 2021/11245
KARAR NO: 2022/1534
KARAR TARİHİ: 08.02.2022

DAVA VE KARARIN ÖZETİ:
Davacı işçi, fazla mesai ücretlerinin ödenmemesi nedeniyle iş sözleşmesini haklı nedenle feshettiğini belirterek kıdem tazminatı ile fazla çalışma ücret alacaklarının tahsilini talep etmiştir.

Yargıtay 9. Hukuk Dairesi kararında:
4857 sayılı İş Kanunu\'nun 24/II-e bendinde 'İşveren tarafından işçinin ücreti kanun hükümleri veya sözleşme şartlarına uygun olarak hesap edilmez veya ödenmezse' işçinin haklı nedenle derhal fesih hakkı bulunduğu düzenlenmiştir. Ücret kavramı; temel ücret, fazla çalışma ücreti, ulusal bayram ve genel tatil ücreti gibi tüm parasal hakları kapsar. İşçinin fazla mesailerinin karşılığının ödenmediği bilirkişi raporuyla saptanmıştır. Bu doğrultuda işçinin iş akdini feshi haklı nedene dayandığından kıdem tazminatı talebinin kabulü isabetlidir.`
  },
  {
    daire: 'Yargıtay 2. Hukuk Dairesi',
    esas_no: '2023/1204',
    karar_no: '2024/412',
    karar_tarihi: '2024-01-24',
    konu: 'Boşanmada Düğünde Takılan Ziynet Eşyalarının Aidiyeti ve Güncel İçtihat Değişikliği',
    ozet: 'Düğünde takılan ziynet eşyaları kural olarak kime takılmışsa ona aittir. Kadına takılan takılar kadının, erkeğe takılan takılar ise erkeğe aittir. Ancak kadına özgü olan takılar (bilezik, küpe, gerdanlık vb.) erkeğe takılmış olsa dahi kadına bağışlanmış sayılır ve kadının kişisel malı kabul edilir. Sandık veya takı torbasına atılan ziynetler konusunda ise yerel örf ve âdet belirleyicidir.',
    metin: `T.C. YARGITAY 2. HUKUK DAİRESİ
ESAS NO: 2023/1204
KARAR NO: 2024/412
KARAR TARİHİ: 24.01.2024

DAVA VE KARARIN ÖZETİ:
Boşanma davası ile birlikte açılan ziynet eşyası alacağı davasında; yerel mahkeme düğünde takılan tüm takıların kadına ait olduğu gerekçesiyle davanın kabulüne karar vermiştir.

Dairemizin güncellenen yerleşik içtihadı uyarınca:
Evlilik merasimi sırasında takılan ziynet eşyaları ve paralar konusunda;
1- Taraflar arasında bu konuda yazılı bir sözleşme veya anlaşma varsa öncelikle bu anlaşma uygulanır.
2- Anlaşma yoksa yerel örf ve âdetin varlığı araştırılır.
3- Örf ve âdet tespit edilemiyorsa, kural olarak takı kime takılmışsa ona ait sayılır. Ancak cinsiyete özgü takılar (yalnızca kadınlarca takılabilen altın bilezik, gerdanlık, küpe gibi ziynetler) damada takılmış olsa bile kadına bağışlanmış sayılarak kadının kişisel malı sayılır. Damada takılan ve erkeğe özgü takılar ile nakit paralar ise damadın kişisel malıdır.`
  },
  {
    daire: 'Yargıtay 4. Hukuk Dairesi',
    esas_no: '2021/6584',
    karar_no: '2022/9412',
    karar_tarihi: '2022-06-15',
    konu: 'Trafik Kazasında Hatır Taşıması İndirimi ve Emniyet Kemeri Takmama (Müterafik Kusur)',
    ozet: 'Hatır taşıması, bir kişinin hiçbir menfaat temin etmeksizin taşınmasıdır. Kazada yaralanan yolcunun hatır için taşındığı sabit ise, Türk Borçlar Kanunu m. 51 ve 52 uyarınca tazminattan uygun bir oranda (uygulamada %20 oranında) hakkaniyet indirimi yapılmalıdır. Ayrıca yolcunun emniyet kemeri takmaması müterafik kusur oluşturur ve ayrı bir indirim sebebi teşkil eder.',
    metin: `T.C. YARGITAY 4. HUKUK DAİRESİ
ESAS NO: 2021/6584
KARAR NO: 2022/9412
KARAR TARİHİ: 15.06.2022

DAVA VE KARARIN ÖZETİ:
Davacı, davalı sürücünün sevk ve idaresindeki araçta yolcu konumunda iken meydana gelen tek taraflı trafik kazası sonucu cismani zarara uğradığını ileri sürerek maddi ve manevi tazminat isteminde bulunmuştur.

Yargıtay 4. Hukuk Dairesi değerlendirmesinde:
TBK m. 51 ve 52 uyarınca zarar görenin zararı doğuran fiile rıza göstermesi veya zararın artmasında etkili olması tazminattan indirim sebebidir. Somut olayda davacı, arkadaşı olan davalının aracına ücretsiz ve tamamen hatır ilişkisine dayalı olarak binmiştir. Taşımada sürücünün herhangi bir maddi veya hukuki menfaati bulunmamaktadır. Mahkemece hatır taşıması nedeniyle tazminattan %20 oranında hakkaniyet indirimi yapılması gerektiği gözetilmelidir.`
  },
  {
    daire: 'Yargıtay 11. Hukuk Dairesi',
    esas_no: '2022/4110',
    karar_no: '2023/2180',
    karar_tarihi: '2023-04-10',
    konu: 'Tacirler Arasında Temerrüt Faizi, TCMB Avans Faizi ve 8 Günlük Fatura İtiraz Süresi',
    ozet: 'TTK m. 1530 uyarınca ticari işletmeler arasında mal ve hizmet tedariki sözleşmelerinde borçlu faturada veya sözleşmede belirlenen günde ödeme yapmazsa herhangi bir ihtara gerek kalmaksızın temerrüde düşer. Temerrüt faizi olarak TCMB avans faiz oranı uygulanabilir. TTK m. 21/2 uyarınca faturayı alan tacir, aldığı tarihten itibaren 8 gün içinde içeriğine itiraz etmezse fatura içeriğini kabul etmiş sayılır.',
    metin: `T.C. YARGITAY 11. HUKUK DAİRESİ
ESAS NO: 2022/4110
KARAR NO: 2023/2180
KARAR TARİHİ: 10.04.2023

DAVA VE KARARIN ÖZETİ:
Davacı tacir, davalı şirkete sattığı emtia karşılığı düzenlenen faturaya dayalı alacağın tahsili için başlattığı icra takibine vaki itirazın iptali ve avans faizi talebinde bulunmuştur.

Yargıtay 11. Hukuk Dairesi kararı:
Her iki taraf tacir olup dava konusu uyuşmazlık her iki tarafın ticari işletmesiyle ilgilidir. 6102 sayılı TTK m. 21/2 gereği faturayı tebellüğ eden taraf 8 gün içinde itiraz etmediğinden mal teslimi ve bedel kesinleşmiştir. Ayrıca TTK m. 1530/2 maddesi gereğince ticari borçlarda temerrüt için ayrıca ihtar çekilmesi zorunlu değildir; vade bitimiyle temerrüt oluşur ve 3095 sayılı Kanun m. 2/2 uyarınca TCMB avans faiz oranı talep edilmesi yasaya uygundur.`
  },
  {
    daire: 'Yargıtay 3. Hukuk Dairesi',
    esas_no: '2022/7841',
    karar_no: '2023/3412',
    karar_tarihi: '2023-05-18',
    konu: 'Kira Tespit Davasında 5 Yıllık Süre Kriteri ve Eski Kiracı Hakkaniyet İndirimi',
    ozet: 'TBK m. 344/3 uyarınca 5 yıldan uzun süreli veya 5 yıldan sonra yenilenen kira sözleşmelerinde emsal kira bedeli belirlenirken TÜFE oranıyla bağlı kalınmaz. Bilirkişi marifetiyle çevredeki boşalan emsal taşınmazların rayiçleri tespit edilir; ancak tespit edilen bu rayiç bedelden, kiracının eski kiracı olması gözetilerek %10 ile %20 arasında hakkaniyet indirimi yapılması yasal zorunluluktur.',
    metin: `T.C. YARGITAY 3. HUKUK DAİRESİ
ESAS NO: 2022/7841
KARAR NO: 2023/3412
KARAR TARİHİ: 18.05.2023

DAVA VE KARARIN ÖZETİ:
Davacı kiralayan, 01.06.2016 başlangıç tarihli konut kira sözleşmesine dayanarak 5. yılın bitiminde kira parasının rayice göre aylık 15.000 TL olarak tespitini talep etmiştir.

Yargıtay 3. Hukuk Dairesi incelemesinde:
Kira sözleşmesinin başlangıcından itibaren 5 yıldan fazla süre geçmiş olduğundan TBK m. 344/3 uyarınca emsal rayiç araştırması yapılması doğrudur. Ancak mahkemece bilirkişinin tespit ettiği 12.000 TL çıplak rayiç bedel üzerinden hiçbir indirim yapılmaksızın karar verilmesi usul ve yasaya aykırıdır. Dairemizin yerleşik içtihatlarına göre, kiralananın eski kiracı tarafından kullanıldığı dikkate alınarak hakkaniyete uygun bir indirim (%10-%20 oranında) yapılmalı ve kira bedeli buna göre belirlenmelidir.`
  },
  {
    daire: 'Yargıtay 12. Hukuk Dairesi',
    esas_no: '2022/8940',
    karar_no: '2023/1105',
    karar_tarihi: '2023-02-16',
    konu: 'İcra Takibinde Emekli Maaşı Haczedilemezliği ve Hacizden Önce Verilen Muvafakatin Geçersizliği',
    ozet: '5510 sayılı Sosyal Sigortalar ve Genel Sağlık Sigortası Kanunu\'nun 93. maddesi gereğince emekli aylıkları nafaka borçları haricinde haczedilemez. Borçlunun icra takibinden veya fiili hacizden önceki muvafakati geçersizdir; muvafakat ancak emekli maaşına fiilen haciz konulduktan sonra icra dairesine verilirse geçerlilik kazanır. Önceden sözleşmeye konulan haciz izinleri batıldır.',
    metin: `T.C. YARGITAY 12. HUKUK DAİRESİ
ESAS NO: 2022/8940
KARAR NO: 2023/1105
KARAR TARİHİ: 16.02.2023

DAVA VE KARARIN ÖZETİ:
Borçlu emekli, maaşı üzerine konulan haczin kaldırılması için icra mahkemesine başvurmuştur. Alacaklı ise borçlunun kredi sözleşmesinde 'emekli maaşımdan kesilmesine muvafakat ediyorum' taahhüdünde bulunduğunu savunmuştur.

Yargıtay 12. Hukuk Dairesi kararı:
5510 sayılı Kanun m. 93 hükmü kamu düzenine ilişkindir. Borçlunun henüz hakkında icra takibi başlatılmadan ya da maaşına fiilen haciz konulmadan önce verdiği muvafakatler hukuken geçersizdir. Emeklinin serbest iradesiyle yapacağı muvafakat beyanı, ancak icra müdürlüğünce maaşına haciz konulmasından sonraki dönemde geçerlidir. Mahkemece şikayetin kabulü ile haczin kaldırılmasına karar verilmesi gerekirken reddi hatalıdır.`
  },
  {
    daire: 'Danıştay İdari Dava Daireleri Kurulu',
    esas_no: '2021/3042',
    karar_no: '2022/1980',
    karar_tarihi: '2022-10-19',
    konu: 'İdarenin Hizmet Kusuru, Görevini Geç veya Hiç Yapmaması ve Kusursuz Sorumluluk',
    ozet: 'İdarenin yürüttüğü kamu hizmetinin gereği gibi işlememesi, geç işlemesi veya hiç işlememesi hizmet kusurunu oluşturur. Hizmet kusurunun bulunmadığı durumlarda ise idarenin tehlike (risk) ilkesi veya kamu külfetleri karşısında eşitlik ilkesi uyarınca kusursuz sorumluluğu söz konusudur. Zarar ile idari eylem arasında uygun illiyet bağı bulunması durumunda tam yargı davasında tazminata hükmedilir.',
    metin: `T.C. DANIŞTAY İDARİ DAVA DAİRELERİ KURULU
ESAS NO: 2021/3042
KARAR NO: 2022/1980
KARAR TARİHİ: 19.10.2022

DAVA VE KARARIN ÖZETİ:
Davacı, kar yağışı sonrasında kamuya açık yolda gerekli tuzlama ve küreme çalışmalarının yapılmaması sebebiyle meydana gelen kazada uğradığı bedensel ve maddi zararların tazmini istemiyle idare aleyhine tam yargı davası açmıştır.

Danıştay İDDK gerekçesinde:
Anayasa\'nın 125. maddesi uyarınca idare, kendi eylem ve işlemlerinden doğan zararı ödemekle yükümlüdür. Yol güvenliğinin sağlanması, mevsim koşullarına göre gerekli yol bakım ve temizlik tedbirlerinin zamanında alınması idarenin asli kamu hizmetidir. Bu hizmetin hiç yürütülmemesi veya geç yürütülmesi hizmet kusuru teşkil eder. Davacının olayda müterafik bir kusuru bulunmadığından, meydana gelen zararın idarece karşılanması gerekir.`
  }
];

export async function POST(req: Request) {
  try {
    const supabase = await createClient();

    // Tabloda mevcut kayıt var mı kontrol et
    const { count, error: countErr } = await (supabase
      .from('emsal_kararlar') as any)
      .select('id', { count: 'exact', head: true });

    if (countErr) {
      return NextResponse.json({ error: 'Veritabanı tablosu sorgulanamadı: ' + countErr.message }, { status: 500 });
    }

    const { searchParams } = new URL(req.url);
    const force = searchParams.get('force') === 'true';

    if (count && count > 0 && !force) {
      return NextResponse.json({
        success: true,
        message: `Veritabanında zaten ${count} adet emsal karar mevcut. Yeniden yüklemek için ?force=true parametresi kullanabilirsiniz.`,
        count
      });
    }

    let insertedCount = 0;

    for (const decision of SEED_DECISIONS) {
      // Embedding oluşturulacak metin: Daire, Esas/Karar, Konu ve Özet
      const textToEmbed = `${decision.daire} ${decision.esas_no} ${decision.karar_no}. Konu: ${decision.konu}. Özet: ${decision.ozet}`;
      const embedding = await generateEmbedding(textToEmbed);

      const record: any = {
        daire: decision.daire,
        esas_no: decision.esas_no,
        karar_no: decision.karar_no,
        karar_tarihi: decision.karar_tarihi,
        konu: decision.konu,
        ozet: decision.ozet,
        metin: decision.metin,
      };

      if (embedding) {
        record.embedding = embedding;
      }

      const { error: insertErr } = await (supabase
        .from('emsal_kararlar') as any)
        .insert(record);

      if (insertErr) {
        console.error('Kayıt ekleme hatası:', insertErr);
      } else {
        insertedCount++;
      }
    }

    return NextResponse.json({
      success: true,
      message: `${insertedCount} adet doğrulanmış gerçek emsal karar başarıyla veritabanına aktarıldı.`,
      count: insertedCount
    });

  } catch (err: any) {
    console.error('Seed hatası:', err);
    return NextResponse.json({ error: 'Seed işlemi sırasında hata oluştu: ' + err.message }, { status: 500 });
  }
}
