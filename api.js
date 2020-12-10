// inisiasi library
const express = require("express")
const bodyParser = require("body-parser")
const cors = require("cors")
const mysql = require("mysql")
const md5 = require ('md5')
const multer = require("multer") // untuk upload file
const path = require("path") // untuk memanggil path direktori
const fs = require("fs") // untuk manajemen file
const moment = require ("moment")
const Cryptr = require("cryptr")
const crypt = new Cryptr("140533601726") // secret key, boleh diganti kok


// implementation
const app = express()
app.use(express.static(__dirname))
app.use(cors())
app.use(express.json())
app.use(express.urlencoded({ extended : true}))
app.use(bodyParser.json())
app.use(bodyParser.urlencoded ({ extended : true }))

// create MySQL Connection
const db = mysql.createConnection({
    host: "localhost",
    user: "root",
    password: "",
    database: "praktikum_rent_car"
})


db.connect(error => {
    if (error) {
        console.log(error.message)
    } else {
        console.log("MySQL Connected")
    }
})


// variabel konfigurasi proses upload file
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        // set file storage
        cb(null, './image');
    },
    filename: (req, file, cb) => {
        // generate file name
        cb(null, "image-"+ Date.now() + path.extname(file.originalname))
    }
})

let upload = multer({storage: storage})


validateToken = () => {
    return (req, res, next) => {
        // cek keberadaan "Token" pada request header
        if (!req.get("Token")) {
            // jika "Token" tidak ada
            res.json({
                message: "Access Forbidden"
            })
        } else {
            // tampung nilai Token
            let token  = req.get("Token")

            // decrypt token menjadi id_karyawan
            let decryptToken = crypt.decrypt(token)

            // sql cek id_karyawan
            let sql = "select * from karyawan where ?"

            // set parameter
            let param = { id_karyawan: decryptToken}

            // run query
            db.query(sql, param, (error, result) => {
                if (error) throw error
                 // cek keberadaan id_karyawan
                if (result.length > 0) {
                    // id_karyawan tersedia
                    next()
                } else {
                    // jika karyawan tidak tersedia
                    res.json({
                        message: "Invalid Token"
                    })
                }
            })
        }

    }
}




// --------------- DATA KARYAWAN ---------------

// end-point menyimpan data karyawan
app.post("/karyawan", validateToken(), (req,res) => {
    // prepare data
    let data = {
        id_karyawan: req.body.id_karyawan,
        nama_karyawan: req.body.nama_karyawan,
        alamat_karyawan: req.body.alamat_karyawan,
        kontak: req.body.kontak,
        username: req.body.username,
        password: md5(req.body.password)
    }

    // create sql query insert
    let sql = "insert into karyawan set ?"

    // run query
    db.query(sql, data, (error, result) => {
        let response = null
        if (error) {
            response = {
                message: error.message
            }
        } else {
            response = {
                message: result.affectedRows + " Data Berhasil Ditambahkan"
            }
        }
        res.json(response) // send response
    })
})


// end-point login karyawan
app.post("/karyawan/auth", (req, res) => {
    // tampung username dan password
    let param = [
        req.body.username, //username
        md5(req.body.password) // password
    ]

    // create sql query
    let sql = "select * from karyawan where username = ? and password = ?"

    // run query
    db.query(sql, param, (error, result) => {
        if (error) throw error

        // cek jumlah data hasil query
        if (result.length > 0) {
            // karyawan tersedia
            res.json({
                message: "Logged",
                token: crypt.encrypt(result[0].id_karyawan), // generate token
                data: result
            })
        } else {
            // karyawan tidak tersedia
            res.json({
                message: "Invalid username/password"
            })
        }
    })
})



// end-point akses data karyawan
app.get("/karyawan", validateToken(), (req, res) => {
    // create sql query
    let sql = "select * from karyawan"

    // run query
    db.query(sql, (error, result) => {
        let response = null
        if (error) {
            response = {
                message: error.message // pesan error
            }
        } else {
            response = {
                count: result.length, // jumlah data
                karyawan: result // isi data
            }
        }
        res.json(response) // send response
    })
})


// end-point akses data karyawan berdasarkan id_karyawan tertentu
app.get("/karyawan/:id", validateToken(), (req, res) => {
    let data = {
        id_karyawan: req.params.id
    }
    // create sql query
    let sql = "select * from karyawan where ?"

    // run query
    db.query(sql, data, (error, result) => {
        let response = null
        if (error) {
            response = {
                message: error.message // pesan error
            }
        } else {
            response = {
                count: result.length, // jumlah data
                karyawan: result // isi data
            }
        }
        res.json(response) // send response
    })
})


// end-point mengubah data karyawan
app.put("/karyawan", validateToken(), (req,res) => {
    // prepare data
    let data = [
        {
            nama_karyawan: req.body.nama_karyawan,
            alamat_karyawan: req.body.alamat_karyawan,
            kontak: req.body.kontak,
            username: req.body.username,
            password: md5(req.body.password)
        },

        // parameter (primary key)
        {
            id_karyawan: req.body.id_karyawan
        }
    ]

    // create sql query update
    let sql = "update karyawan set ? where ?"

    // run query
    db.query(sql, data, (error, result) => {
        let response = null
        if (error) {
            response = {
                message: error.message
            }
        } else {
            response = {
                message: result.affectedRows + " Data Berhasil Dirubah"
            }
        }
        res.json(response) // send response
    })
})


// end-point menghapus data karyawan berdasarkan id_karyawan
app.delete("/karyawan/:id", validateToken(), (req,res) => {
    // prepare data
    let data = {
        id_karyawan: req.params.id
    }

    // create query sql delete
    let sql = "delete from karyawan where ?"

    // run query
    db.query(sql, data, (error, result) => {
        let response = null
        if (error) {
            response = {
                message: error.message
            }
        } else {
            response = {
                message: result.affectedRows + " Data Berhasil Dihapus"
            }
        }
        res.json(response) // send response
    })
})




// --------------- DATA MOBIL ---------------

// end-point menyimpan data mobil
app.post("/mobil", upload.single("image"), validateToken(), (req,res) => {
    // prepare data
    let data = {
        id_mobil: req.body.id_mobil,
        nomor_mobil: req.body.nomor_mobil,
        merk: req.body.merk,
        jenis: req.body.jenis,
        warna: req.body.warna,
        tahun_pembuatan: req.body.tahun_pembuatan,
        biaya_sewa_per_hari: req.body.biaya_sewa_per_hari,
        image: req.file.filename
    }

    // run query
    if (!req.file) {
        // jika tidak ada file yang diupload
        res.json({
            message: "Tidak ada file yang dikirim"
        })
    } else {
        // create sql insert
        let sql = "insert into mobil set ?"

        // run query
        db.query(sql, data, (error, result) => {
            if(error) throw error
            res.json({
                message: result.affectedRows + " data berhasil disimpan"
            })
        })
    }
})


// end-point akses data mobil
app.get("/mobil", validateToken(), (req, res) => {
    // create sql query
    let sql = "select * from mobil"

    // run query
    db.query(sql, (error, result) => {
        let response = null
        if (error) {
            response = {
                message: error.message // pesan error
            }
        } else {
            response = {
                count: result.length, // jumlah data
                mobil: result // isi data
            }
        }
        res.json(response) // send response
    })
})


// end-point akses data mobil berdasarkan id_mobil tertentu
app.get("/mobil/:id", validateToken(), (req, res) => {
    let data = {
        id_mobil: req.params.id
    }
    // create sql query
    let sql = "select * from mobil where ?"

    // run query
    db.query(sql, data, (error, result) => {
        let response = null
        if (error) {
            response = {
                message: error.message // pesan error
            }
        } else {
            response = {
                count: result.length, // jumlah data
                mobil: result // isi data
            }
        }
        res.json(response) // send response
    })
})


// end-point mengubah data mobil
app.put("/mobil", upload.single("image"), validateToken(), (req,res) => {
  let data = null, sql = null
  // paramter perubahan data
  let param = { id_mobil: req.body.id_mobil }

  if (!req.file) {
      // jika tidak ada file yang dikirim = update data saja
      data = {
        id_mobil: req.body.id_mobil,
        nomor_mobil: req.body.nomor_mobil,
        merk: req.body.merk,
        jenis: req.body.jenis,
        warna: req.body.warna,
        tahun_pembuatan: req.body.tahun_pembuatan,
        biaya_sewa_per_hari: req.body.biaya_sewa_per_hari
      }
  } else {
      // jika mengirim file = update data + reupload
      data = {
        id_mobil: req.body.id_mobil,
        nomor_mobil: req.body.nomor_mobil,
        merk: req.body.merk,
        jenis: req.body.jenis,
        warna: req.body.warna,
        tahun_pembuatan: req.body.tahun_pembuatan,
        biaya_sewa_per_hari: req.body.biaya_sewa_per_hari,
        image: req.file.filename
      }

      // get data yg akan diupdate utk mendapatkan nama file yang lama
      sql = "select * from mobil where ?"
      // run query
      db.query(sql, param, (err, result) => {
          if (err) throw err
          // tampung nama file yang lama
          let fileName = result[0].image

          // hapus file yg lama
          let dir = path.join(__dirname,"image",fileName)
          fs.unlink(dir, (error) => {})
      })

  }

  // create sql update
  sql = "update mobil set ? where ?"

  // run sql update
  db.query(sql, [data,param], (error, result) => {
      if (error) {
          res.json({
              message: error.message
          })
      } else {
          res.json({
              message: result.affectedRows + " data berhasil diubah"
          })
      }
    })
  })



// end-point menghapus data mobil berdasarkan id_mobil
app.delete("/mobil/:id", validateToken(), (req,res) => {
  // prepare data
  let data = {
      id_mobil: req.params.id
  }

  // create query sql delete
  let sql = "delete from mobil where ?"

  // run query
  db.query(sql, data, (error, result) => {
      let response = null
      if (error) {
          response = {
              message: error.message
          }
      } else {
          response = {
              message: result.affectedRows + " Data Berhasil Dihapus"
          }
      }
      res.json(response) // send response
  })
})


// --------------- DATA PELANGGAN ---------------

// end-point menyimpan data pelanggan
app.post("/pelanggan", validateToken(), (req,res) => {
    // prepare data
    let data = {
        id_pelanggan: req.body.id_pelanggan,
        nama_pelanggan: req.body.nama_pelanggan,
        alamat_pelanggan: req.body.alamat_pelanggan,
        kontak: req.body.kontak
    }

    // create sql query insert
    let sql = "insert into pelanggan set ?"

    // run query
    db.query(sql, data, (error, result) => {
        let response = null
        if (error) {
            response = {
                message: error.message
            }
        } else {
            response = {
                message: result.affectedRows + " Data Berhasil Ditambahkan"
            }
        }
        res.json(response) // send response
    })
})


// end-point akses data pelanggan
app.get("/pelanggan", validateToken(), (req, res) => {
    // create sql query
    let sql = "select * from pelanggan"

    // run query
    db.query(sql, (error, result) => {
        let response = null
        if (error) {
            response = {
                message: error.message // pesan error
            }
        } else {
            response = {
                count: result.length, // jumlah data
                pelanggan: result // isi data
            }
        }
        res.json(response) // send response
    })
})


// end-point akses data karyawan berdasarkan id_pelanggan tertentu
app.get("/pelanggan/:id", validateToken(), (req, res) => {
    let data = {
        id_pelanggan: req.params.id
    }
    // create sql query
    let sql = "select * from pelanggan where ?"

    // run query
    db.query(sql, data, (error, result) => {
        let response = null
        if (error) {
            response = {
                message: error.message // pesan error
            }
        } else {
            response = {
                count: result.length, // jumlah data
                pelanggan: result // isi data
            }
        }
        res.json(response) // send response
    })
})


// end-point mengubah data pelanggan
app.put("/pelanggan", validateToken(), (req,res) => {
    // prepare data
    let data = [
        {
            id_pelanggan: req.body.id_pelanggan,
            nama_pelanggan: req.body.nama_pelanggan,
            alamat_pelanggan: req.body.alamat_pelanggan,
            kontak: req.body.kontak
        },

        // parameter (primary key)
        {
            id_pelanggan: req.body.id_pelanggan
        }
    ]

    // create sql query update
    let sql = "update pelanggan set ? where ?"

    // run query
    db.query(sql, data, (error, result) => {
        let response = null
        if (error) {
            response = {
                message: error.message
            }
        } else {
            response = {
                message: result.affectedRows + "  Data Berhasil Dirubah"
            }
        }
        res.json(response) // send response
    })
})


// end-point menghapus data pelanggan berdasarkan id_pelanggan
app.delete("/pelanggan/:id", validateToken(), (req,res) => {
    // prepare data
    let data = {
        id_pelanggan: req.params.id
    }

    // create query sql delete
    let sql = "delete from pelanggan where ?"

    // run query
    db.query(sql, data, (error, result) => {
        let response = null
        if (error) {
            response = {
                message: error.message
            }
        } else {
            response = {
                message: result.affectedRows + " Data Berhasil Dihapus"
            }
        }
        res.json(response) // send response
    })
})



// ---------------TRANSAKSI SEWA ---------------

// end-point menyimpan data transaksi sewa
app.post("/sewa", validateToken(), (req,res) => {
    // prepare data to sewa
    let data = {
        id_sewa: req.body.id_sewa,
        id_mobil: req.body.id_mobil,
        id_karyawan: req.body.id_karyawan,
        id_pelanggan: req.body.id_pelanggan,
        tgl_sewa: moment().format('YYYY-MM-DD HH:mm:ss'),
        tgl_kembali: req.body.tgl_kembali, // get current time
        total_bayar: req.body.total_bayar
    }

    // create query insert to sewa
    let sql = "insert into sewa set ?"

    // run query
    db.query(sql, data, (error, result) => {
        let response = null

        if (error) {
            res.json({message: error.message})
        } else {
            res.json({message: "Data SEWA Berhasil Ditambahkan"})
        }
    })
})


// end-point akses data transaksi sewa
app.get("/sewa", validateToken(), (req,res) => {
    // create sql query
    let sql = "select s.id_sewa, m.id_mobil, m.nomor_mobil, m.merk, m.jenis, m.warna, k.id_karyawan, k.nama_karyawan, p.id_pelanggan, p.nama_pelanggan, s.tgl_sewa, s.tgl_kembali, s.total_bayar " +
    "from sewa s join mobil m on s.id_mobil = m.id_mobil " +
    "join karyawan k on s.id_karyawan = k.id_karyawan " +
    "join pelanggan p on s.id_pelanggan = p.id_pelanggan"

    // run query
    db.query(sql, (error, result) => {
        if (error) {
            res.json({ message: error.message})
        }else{
            res.json({
                count: result.length,
                sewa: result
            })
        }
    })
})

// end-point untuk menampilkan detail data transaksi sewa berdasarkan id_sewa
app.get("/sewa/:id_sewa", validateToken(), (req,res) => {
    let param = { id_sewa: req.params.id_sewa}

    // create sql query
    let sql = "select s.id_sewa, m.id_mobil, m.nomor_mobil, m.merk, m.jenis, m.warna, k.id_karyawan, k.nama_karyawan, p.id_pelanggan, p.nama_pelanggan, s.tgl_sewa, s.tgl_kembali, s.total_bayar " +
    "from sewa s join mobil m on s.id_mobil = m.id_mobil " +
    "join karyawan k on s.id_karyawan = k.id_karyawan " +
    "join pelanggan p on s.id_pelanggan = p.id_pelanggan " +
    "where ?"

    db.query(sql, param, (error, result) => {
        if (error) {
            res.json({ message: error.message})
        }else{
            res.json({
                count: result.length,
                sewa: result
            })
        }
    })
})


// end-point mengubah data transaksi sewa
app.put("/sewa", validateToken(), (req,res) => {

    // prepare data
    let data = [
        {
            id_mobil: req.body.id_mobil,
            id_karyawan: req.body.id_karyawan,
            id_pelanggan: req.body.id_pelanggan,
            tgl_kembali: req.body.tgl_kembali, // get current time
            total_bayar: req.body.total_bayar
        },

        // parameter (primary key)
        {
            id_sewa: req.body.id_sewa
        }
    ]

    // create sql query update
    let sql = "update sewa set ? where ?"

    // run query
    db.query(sql, data, (error, result) => {
        let response = null
        if (error) {
            response = {
                message: error.message
            }
        } else {
            response = {
                message: result.affectedRows + " Data Berhasil Dirubah"
            }
        }
        res.json(response) // send response
    })
})


// end-point menghapus data transaksi sewa berdasarkan id_sewa
app.delete("/sewa/:id_sewa", validateToken(), (req, res) => {
    let param = { id_sewa: req.params.id_sewa}

    // create sql query delete sewa
    let sql = "delete from sewa where ?"

    db.query(sql, param, (error, result) => {
        if (error) {
            res.json({ message: error.message})
        } else {
            res.json({message: "Data SEWA Berhasil Dihapus"})
        }
    })

})


app.listen(8000, () => {
    console.log("Run on port 8000")
})
