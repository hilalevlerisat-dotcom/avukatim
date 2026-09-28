# MasrafX ve UYAP Entegrasyonu İnceleme Raporu

**Tarih:** 28 Eylül 2026
**Konu:** MasrafX uygulamasının UYAP entegrasyonu özellikleri ve "Avukat Asistanı" projemiz için potansiyel çıkarımlar.

## 1. MasrafX Nedir?
MasrafX, avukatlar ve hukuk büroları için geliştirilmiş, masraf, tahsilat, vekalet ücreti ve cari hesap takibini tek çatı altında toplayan bir **ön muhasebe ve finans yönetim programıdır**. Özellikle **UYAP (Ulusal Yargı Ağı Bilişim Sistemi)** entegrasyonu konusundaki otomasyon yetenekleriyle öne çıkar.

## 2. MasrafX'in Öne Çıkan UYAP Özellikleri

### UYAP'tan Harç ve Masraf Aktarımı
MasrafX'in en çok vurgulanan özelliği manuel veri girişini bitirmesidir. İcra veya dava dosyalarında yapılan UYAP harç ödemeleri (başvurma harcı, vekalet harcı, tebligat vb.), e-imza bağlantısı sayesinde doğrudan uygulamaya aktarılır ve ilgili dosyanın/müvekkilin cari hesabına otomatik olarak işlenir.

### Tek Tuşla Müvekkil ve Dosya Çekme
Avukatların portalında vekil olarak kayıtlı oldukları dosyalardaki taraf (müvekkil) bilgileri ve dosya temel bilgileri tek tuşla sisteme entegre edilebilmektedir. Bu durum veri taşıma (onboarding) sürecini saniyelere indirir.

### Açık Bankacılık ile Tahsilat Eşleştirme
Banka hesaplarındaki hesap hareketleri (havale/EFT) açık bankacılık API'leri üzerinden sisteme düşer. Gelen ödemeler otomatik olarak veya tek tıkla doğru müvekkilin cari hesabına "Tahsilat" olarak yansıtılır.

### İade Alınabilir Avansların Tespiti
UYAP üzerinde, mahkemede veya icra dairesinde atıl durumda kalmış, iadesi talep edilebilecek gider avanslarını dosya bazında tespit ederek avukata raporlar.

### Otomatik E-Posta ve Raporlama (Müvekkil Şeffaflığı)
UYAP üzerinden çekilen güncel masraflar, tahsilatlar veya bekleyen hatırlatıcılar, düzenli aralıklarla (veya tetiklemeyle) müvekkillere e-posta olarak raporlanabilir.

## 3. "Avukat Asistanı" Uygulamamıza Entegre Edebileceğimiz Fikirler

Mevcut sistemimizde (`UploadZone` vb.) UYAP'tan manuel indirilen evrakları sınıflandırabiliyoruz. MasrafX mantığındaki gibi otomasyonlar eklemek bizi bir üst seviyeye taşıyacaktır:

1. **Masaüstü İstemci veya Tarayıcı Eklentisi (E-İmza Köprüsü):** UYAP Avukat Portalına direkt API ile bağlanmak hukuken ve teknik olarak çok zordur (devlet kapısı olduğu için). MasrafX bu sorunu **Masaüstü uygulaması** ve e-imza modülü aracılığıyla (veya Chrome eklentisiyle) kullanıcının aktif UYAP oturumundan (scraping/okuma yöntemiyle) veri çekerek çözüyor gibi görünüyor. Biz de Electron.js veya bir Chrome eklentisi yardımıyla UYAP portalından **dosya listesi ve masraf dökümü çeken bir köprü** yapabiliriz.
2. **Akıllı Cari Hesap (Finans Modülü):** Mevcut `FinansClient` modülümüze UYAP'tan dışa aktarılan `.xlsx` (Excel) veya `.udf` harç dökümlerini toplu içeri aktarma (Bulk Import) özelliği ekleyebiliriz. Böylece e-imza bağlantısı kuramasak bile, UYAP excel çıktılarıyla harçları saniyeler içinde müvekkillere yansıtabiliriz.
3. **Avans Hatırlatıcıları:** Hatırlatıcılar modülümüze "Avans İadesi Bekleyen Dosyalar" diye özel bir kategori/otomasyon ekleyebiliriz.

**Sonuç:** MasrafX'in en büyük vaadi **manuel veri girişini** UYAP ve Banka entegrasyonlarıyla sıfıra indirmesidir. Sistemimizi bu vizyona yaklaştırmak için öncelikli adım, UYAP dökümlerini (PDF/Excel) içeri aktarma otomasyonunu geliştirmek olacaktır.
