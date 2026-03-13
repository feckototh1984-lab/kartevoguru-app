import React from 'react'
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Image,
} from '@react-pdf/renderer'
import type { WorkOrderPdfData } from './getWorkOrderPdfData'

const styles = StyleSheet.create({
  page: {
    padding: 28,
    fontSize: 10,
    color: '#1f2937',
    fontFamily: 'Helvetica',
  },
  pagePhotos: {
    padding: 28,
    fontSize: 10,
    color: '#1f2937',
    fontFamily: 'Helvetica',
  },
  card: {
    border: '1 solid #e2e8f0',
    borderRadius: 10,
    overflow: 'hidden',
  },
  header: {
    padding: 18,
    borderBottom: '1 solid #e2e8f0',
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 16,
  },
  brandLeft: {
    flexDirection: 'row',
    gap: 14,
    alignItems: 'flex-start',
    flex: 1,
  },
  logoBox: {
    width: 120,
  },
  logo: {
    width: 120,
    height: 42,
    objectFit: 'contain',
  },
  brandTextWrap: {
    flex: 1,
  },
  brandSmall: {
    fontSize: 10,
    color: '#64748b',
    marginBottom: 4,
  },
  title: {
    fontSize: 19,
    fontWeight: 'bold',
    color: '#0f172a',
  },
  badge: {
    marginTop: 8,
    fontSize: 9,
    color: '#ffffff',
    backgroundColor: '#388cc4',
    paddingTop: 4,
    paddingBottom: 4,
    paddingLeft: 8,
    paddingRight: 8,
    borderRadius: 999,
    alignSelf: 'flex-start',
  },
  rightMeta: {
    width: 150,
    alignItems: 'flex-end',
  },
  metaLabel: {
    fontSize: 8,
    textTransform: 'uppercase',
    color: '#64748b',
  },
  metaValue: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#0f172a',
    marginTop: 3,
  },
  metaValueSmall: {
    fontSize: 9,
    color: '#334155',
    marginTop: 3,
  },
  body: {
    padding: 18,
  },
  grid2: {
    flexDirection: 'row',
    gap: 18,
  },
  col: {
    flex: 1,
  },
  section: {
    marginBottom: 16,
  },
  sectionBreakAvoid: {
    marginBottom: 16,
  },
  sectionTitleWrap: {
    borderBottom: '2 solid #cbd5e1',
    paddingBottom: 4,
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#0f172a',
  },
  line: {
    marginBottom: 4,
    lineHeight: 1.45,
  },
  label: {
    fontWeight: 'bold',
  },
  softBox: {
    minHeight: 56,
    border: '1 solid #e2e8f0',
    backgroundColor: '#f8fafc',
    borderRadius: 6,
    padding: 10,
    lineHeight: 1.5,
  },
  techRow: {
    lineHeight: 1.5,
  },
  table: {
    border: '1 solid #cbd5e1',
    borderRadius: 6,
    overflow: 'hidden',
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#f1f5f9',
    borderBottom: '1 solid #cbd5e1',
  },
  tableHeaderCell: {
    flex: 1,
    padding: 8,
    fontWeight: 'bold',
    fontSize: 9,
  },
  tableRow: {
    flexDirection: 'row',
    borderTop: '1 solid #e2e8f0',
  },
  tableCell: {
    flex: 1,
    padding: 8,
    fontSize: 9,
    lineHeight: 1.4,
  },
  alertsGrid: {
    flexDirection: 'row',
    gap: 16,
  },
  alertBox: {
    flex: 1,
    borderRadius: 6,
    padding: 10,
    border: '1 solid #e2e8f0',
    backgroundColor: '#f8fafc',
  },
  alertTitle: {
    fontSize: 10,
    fontWeight: 'bold',
    marginBottom: 6,
  },
  bullet: {
    marginBottom: 4,
    lineHeight: 1.45,
  },
  signaturesRow: {
    flexDirection: 'row',
    gap: 28,
    marginTop: 10,
  },
  signatureCol: {
    flex: 1,
  },
  signatureLabel: {
    fontSize: 9,
    color: '#64748b',
    marginBottom: 8,
  },
  signatureBox: {
    border: '1 solid #e2e8f0',
    backgroundColor: '#f8fafc',
    borderRadius: 6,
    padding: 8,
  },
  signatureInner: {
    height: 70,
    borderBottom: '1 solid #94a3b8',
    alignItems: 'center',
    justifyContent: 'center',
  },
  signatureImage: {
    maxWidth: '100%',
    maxHeight: 55,
    objectFit: 'contain',
  },
  signatureEmpty: {
    height: 70,
    borderBottom: '1 solid #94a3b8',
  },
  signedAt: {
    marginTop: 6,
    fontSize: 8,
    color: '#64748b',
  },
  signerName: {
    marginTop: 6,
    fontSize: 10,
    fontWeight: 'bold',
  },
  footerNote: {
    marginTop: 10,
    fontSize: 8,
    color: '#94a3b8',
    textAlign: 'center',
  },
  photosHeader: {
    marginBottom: 18,
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 16,
    alignItems: 'center',
  },
  photosTitleSmall: {
    fontSize: 10,
    color: '#64748b',
    marginBottom: 4,
  },
  photosTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#0f172a',
  },
  photosSub: {
    marginTop: 8,
    fontSize: 10,
    color: '#64748b',
  },
  photoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },
  photoCard: {
    width: '47%',
    border: '1 solid #e2e8f0',
    borderRadius: 8,
    overflow: 'hidden',
    marginBottom: 16,
  },
  photoImageWrap: {
    height: 180,
    backgroundColor: '#f1f5f9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  photoImage: {
    width: '100%',
    height: 180,
    objectFit: 'cover',
  },
  photoCaption: {
    borderTop: '1 solid #e2e8f0',
    padding: 8,
    fontSize: 9,
    color: '#475569',
  },
})

function formatDate(value: string | null | undefined) {
  if (!value) return '—'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return new Intl.DateTimeFormat('hu-HU', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(date)
}

function formatDateTime(value: string | null | undefined) {
  if (!value) return '—'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return new Intl.DateTimeFormat('hu-HU', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date)
}

export default function WorkOrderPdfDocument({
  data,
}: {
  data: WorkOrderPdfData
}) {
  const { workOrder, customer, photos, products, technicianSignature } = data

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.card}>
          <View style={styles.header}>
            <View style={styles.brandLeft}>
              <View style={styles.logoBox}>
                <Image src="/logo.png" style={styles.logo} />
              </View>

              <View style={styles.brandTextWrap}>
                <Text style={styles.brandSmall}>KártevőGuru</Text>
                <Text style={styles.title}>KÁRTEVŐIRTÁSI MUNKALAP</Text>
                <Text style={styles.badge}>Egészségügyi kártevőirtás</Text>
              </View>
            </View>

            <View style={styles.rightMeta}>
              <Text style={styles.metaLabel}>Munkalap sorszám</Text>
              <Text style={styles.metaValue}>
                {workOrder.order_number || '—'}
              </Text>

              <Text style={[styles.metaLabel, { marginTop: 10 }]}>Generálva</Text>
              <Text style={styles.metaValueSmall}>
                {formatDateTime(workOrder.created_at)}
              </Text>
            </View>
          </View>

          <View style={styles.body}>
            <View style={[styles.grid2, styles.sectionBreakAvoid]}>
              <View style={styles.col}>
                <View style={styles.sectionTitleWrap}>
                  <Text style={styles.sectionTitle}>Szolgáltató adatai</Text>
                </View>

                <Text style={styles.line}>
                  <Text style={styles.label}>Szolgáltató: </Text>KártevőGuru
                </Text>
                <Text style={styles.line}>
                  <Text style={styles.label}>Felelős személy: </Text>
                  {technicianSignature?.technician_name || 'Tóth Ferenc'}
                </Text>
                <Text style={styles.line}>
                  <Text style={styles.label}>Telefon: </Text>+36 30 602 0650
                </Text>
                <Text style={styles.line}>
                  <Text style={styles.label}>E-mail: </Text>info@kartevoguru.hu
                </Text>
                <Text style={styles.line}>
                  <Text style={styles.label}>Székhely / cím: </Text>
                  8700 Marcali, Borsó-hegyi út 4779
                </Text>
                <Text style={styles.line}>
                  <Text style={styles.label}>Működési nyilv. szám: </Text>
                  SO-05/neo976-1/2025
                </Text>
                <Text style={styles.line}>
                  <Text style={styles.label}>Nyilvántartási szám: </Text>
                  0099697
                </Text>
                <Text style={styles.line}>
                  <Text style={styles.label}>Adószám: </Text>
                  91094722-1-34
                </Text>
                <Text style={styles.line}>
                  <Text style={styles.label}>Bankszámlaszám: </Text>
                  12042847-01896099-00100007
                </Text>
              </View>

              <View style={styles.col}>
                <View style={styles.sectionTitleWrap}>
                  <Text style={styles.sectionTitle}>Szolgáltatás részletei</Text>
                </View>

                <Text style={styles.line}>
                  <Text style={styles.label}>Megrendelő: </Text>
                  {customer?.name || '—'}
                </Text>
                <Text style={styles.line}>
                  <Text style={styles.label}>Kapcsolattartó: </Text>
                  {customer?.contact_person || '—'}
                </Text>
                <Text style={styles.line}>
                  <Text style={styles.label}>Telefonszám: </Text>
                  {customer?.phone || '—'}
                </Text>
                <Text style={styles.line}>
                  <Text style={styles.label}>E-mail: </Text>
                  {customer?.email || '—'}
                </Text>
                <Text style={styles.line}>
                  <Text style={styles.label}>Elvégzés időpontja: </Text>
                  {formatDate(workOrder.service_date)}
                </Text>
                <Text style={styles.line}>
                  <Text style={styles.label}>Munka típusa: </Text>
                  {workOrder.job_type || '—'}
                </Text>
                <Text style={styles.line}>
                  <Text style={styles.label}>Célzott kártevő: </Text>
                  {workOrder.target_pest || '—'}
                </Text>
                <Text style={styles.line}>
                  <Text style={styles.label}>Helyszín: </Text>
                  {workOrder.address || customer?.address || '—'}
                </Text>
                <Text style={styles.line}>
                  <Text style={styles.label}>Státusz: </Text>
                  {workOrder.status || '—'}
                </Text>
              </View>
            </View>

            <View style={styles.section}>
              <View style={styles.sectionTitleWrap}>
                <Text style={styles.sectionTitle}>Kártevőirtó technikusok</Text>
              </View>
              <Text style={styles.techRow}>
                {technicianSignature?.technician_name || 'Tóth Ferenc'} (Működési
                nyilvántartási szám: SO-05/neo976-1/2025)
              </Text>
            </View>

            <View style={styles.section}>
              <View style={styles.sectionTitleWrap}>
                <Text style={styles.sectionTitle}>Munkalap adatai</Text>
              </View>

              <Text style={styles.line}>
                <Text style={styles.label}>Ügyfél címe: </Text>
                {customer?.address || '—'}
              </Text>
              <Text style={styles.line}>
                <Text style={styles.label}>Ügyfél típusa: </Text>
                {customer?.customer_type || '—'}
              </Text>
              <Text style={styles.line}>
                <Text style={styles.label}>Megjegyzés: </Text>
                {customer?.notes || '—'}
              </Text>
            </View>

            <View style={styles.section}>
              <View style={styles.sectionTitleWrap}>
                <Text style={styles.sectionTitle}>Kezelés leírása</Text>
              </View>

              <View style={styles.softBox}>
                <Text>{workOrder.treatment_description || '—'}</Text>
              </View>
            </View>

            <View style={styles.section}>
              <View style={styles.sectionTitleWrap}>
                <Text style={styles.sectionTitle}>Felhasznált készítmények</Text>
              </View>

              <View style={styles.table}>
                <View style={styles.tableHeader}>
                  <Text style={styles.tableHeaderCell}>Termék</Text>
                  <Text style={styles.tableHeaderCell}>Mennyiség</Text>
                  <Text style={styles.tableHeaderCell}>Alkalmazási technika</Text>
                  <Text style={styles.tableHeaderCell}>Célzott kártevő</Text>
                </View>

                {products.length > 0 ? (
                  products.map((product) => (
                    <View key={product.id} style={styles.tableRow}>
                      <Text style={styles.tableCell}>
                        {product.product_name || '—'}
                      </Text>
                      <Text style={styles.tableCell}>
                        {product.quantity || '—'}
                      </Text>
                      <Text style={styles.tableCell}>
                        {product.method || '—'}
                      </Text>
                      <Text style={styles.tableCell}>
                        {product.target_pest || '—'}
                      </Text>
                    </View>
                  ))
                ) : (
                  <View style={styles.tableRow}>
                    <Text style={styles.tableCell}>Nincs még külön rögzítve</Text>
                    <Text style={styles.tableCell}>—</Text>
                    <Text style={styles.tableCell}>{workOrder.job_type || '—'}</Text>
                    <Text style={styles.tableCell}>
                      {workOrder.target_pest || '—'}
                    </Text>
                  </View>
                )}
              </View>
            </View>

            <View style={styles.section}>
              <View style={styles.sectionTitleWrap}>
                <Text style={styles.sectionTitle}>
                  Figyelmeztetések, óvintézkedések és javasolt teendők
                </Text>
              </View>

              {workOrder.auto_warnings?.length || workOrder.auto_tasks?.length ? (
                <View style={styles.alertsGrid}>
                  <View style={styles.alertBox}>
                    <Text style={[styles.alertTitle, { color: '#be123c' }]}>
                      Figyelmeztetések
                    </Text>

                    {workOrder.auto_warnings?.length ? (
                      workOrder.auto_warnings.map((item, index) => (
                        <Text key={`warning-${index}`} style={styles.bullet}>
                          • {item}
                        </Text>
                      ))
                    ) : (
                      <Text>Nincs automatikus figyelmeztetés.</Text>
                    )}
                  </View>

                  <View style={styles.alertBox}>
                    <Text style={[styles.alertTitle, { color: '#1d4ed8' }]}>
                      Teendők
                    </Text>

                    {workOrder.auto_tasks?.length ? (
                      workOrder.auto_tasks.map((item, index) => (
                        <Text key={`task-${index}`} style={styles.bullet}>
                          • {item}
                        </Text>
                      ))
                    ) : (
                      <Text>Nincs automatikus teendő.</Text>
                    )}
                  </View>
                </View>
              ) : (
                <View style={styles.softBox}>
                  <Text>
                    A helyszíni tájékoztatás szerinti óvintézkedések betartása
                    javasolt.
                  </Text>
                </View>
              )}
            </View>

            <View style={styles.section}>
              <View style={styles.sectionTitleWrap}>
                <Text style={styles.sectionTitle}>Aláírás</Text>
              </View>

              <View style={styles.signaturesRow}>
                <View style={styles.signatureCol}>
                  <Text style={styles.signatureLabel}>Szolgáltató aláírás</Text>

                  {technicianSignature?.signature_data ? (
                    <View style={styles.signatureBox}>
                      <View style={styles.signatureInner}>
                        <Image
                          src={technicianSignature.signature_data}
                          style={styles.signatureImage}
                        />
                      </View>
                    </View>
                  ) : (
                    <View style={styles.signatureEmpty} />
                  )}

                  <Text style={styles.signerName}>
                    {technicianSignature?.technician_name || 'Tóth Ferenc'}
                  </Text>
                </View>

                <View style={styles.signatureCol}>
                  <Text style={styles.signatureLabel}>Ügyfél aláírás</Text>

                  {workOrder.customer_signature_url ? (
                    <View style={styles.signatureBox}>
                      <View style={styles.signatureInner}>
                        <Image
                          src={workOrder.customer_signature_url}
                          style={styles.signatureImage}
                        />
                      </View>
                      <Text style={styles.signedAt}>
                        Aláírva: {formatDateTime(workOrder.signed_at)}
                      </Text>
                    </View>
                  ) : (
                    <View style={styles.signatureEmpty} />
                  )}

                  <Text style={styles.signerName}>
                    {customer?.name || 'Megrendelő'}
                  </Text>
                </View>
              </View>
            </View>

            <Text style={styles.footerNote}>
              Dokumentum generálva: {formatDateTime(workOrder.created_at)}
            </Text>
          </View>
        </View>
      </Page>

      {photos.length > 0 && (
        <Page size="A4" style={styles.pagePhotos}>
          <View style={styles.photosHeader}>
            <View>
              <Text style={styles.photosTitleSmall}>KártevőGuru</Text>
              <Text style={styles.photosTitle}>HELYSZÍNI FOTÓDOKUMENTÁCIÓ</Text>
              <Text style={styles.photosSub}>
                Munkalap: {workOrder.order_number || '—'}
              </Text>
            </View>

            <Image src="/logo.png" style={styles.logo} />
          </View>

          <View style={styles.photoGrid}>
            {photos.map((photo, index) => (
              <View key={photo.id} style={styles.photoCard}>
                <View style={styles.photoImageWrap}>
                  {photo.public_url ? (
                    <Image src={photo.public_url} style={styles.photoImage} />
                  ) : (
                    <Text>Nincs előnézet</Text>
                  )}
                </View>

                <Text style={styles.photoCaption}>
                  Fotó {index + 1}
                  {photo.file_name ? ` — ${photo.file_name}` : ''}
                </Text>
              </View>
            ))}
          </View>
        </Page>
      )}
    </Document>
  )
}