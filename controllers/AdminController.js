import Admin from "../models/Admin.js";
import Doctor from "../models/Doctor.js";
import Hospital from "../models/Hospital.js";
import { validationResult } from 'express-validator';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

export const register = async (req, res) => {
     try {
          const errors = validationResult(req);
          if (!errors.isEmpty()){
               return res.status(400).json(errors.array());
          }
          const password = req.body.password;
          const salt = await bcrypt.genSalt(10);
          const hPassword = await bcrypt.hash(password, salt);

          const newDocument = new Admin({
               username: req.body.username,
               hashedPassword: hPassword
          });

          const newAdmin = await newDocument.save(); 

          const token = jwt.sign({
               _id: newAdmin._id
          }, 'adminkey', {
               expiresIn: '3d'
          });

          const { hashedPassword, ...adminData } = newAdmin._doc;

          res.json({
               ...adminData,
               token
          });
     } catch (error) {
          console.log(error);
          res.status(500).json({
               message: 'Failed to add new admin'
          });
     }
}

export const login = async (req, res) => {
     try {
          const admin = await Admin.findOne({username: req.body.username});
          if (!admin) {
               return res.status(404).json({
                    message: 'Admin not found'
               });
          };

          const isValidPassword = await bcrypt.compare(req.body.password, admin._doc.hashedPassword);
          if (!isValidPassword) {
               return res.status(400).json({
                    message: 'Incorrect username or password'
               });
          };

          const token = jwt.sign({
               _id: admin._id
          }, 'adminkey', {
               expiresIn: '3d'
          });

          const { hashedPassword, ...adminData } = admin._doc;

          res.json({
               ...adminData,
               token
          });
     } catch (error) {
          console.log(error);
          res.status(500).json({
               message: 'Failed to log in admin'
          });
     }
}


export const confirm = async (req, res) => {
     try {
          const updatedDoctor = await Doctor.updateOne(
               {_id: req.body._id}, 
               {$set: {access: true}}
          );

          if(updatedDoctor.matchedCount === 0){
               return res.status(404).json({
                    message: 'Doctor not found'
               });
          }

          res.json(updatedDoctor);        
     } catch (error) {
          console.log(error);
          res.status(500).json({
               message: 'Can not confirm a doctor'
          })
     }
}

export const deny = async (req, res) => {
     try {
          const updatedDoctor = await Doctor.updateOne({_id: req.body._id}, {$set: {access: false}});

          if(updatedDoctor.matchedCount === 0){
               return res.status(404).json({
                    message: 'Doctor not found'
               });
          }

          res.json(updatedDoctor);        
     } catch (error) {
          console.log(error);
          res.status(500).json({
               message: 'Can not deny a doctor'
          })
     }
}

export const getAllDoctorsWithoutAccess = async (req, res) => {
     try {
          const doctors = await Doctor.find({access: {$exists: false}}).populate('hospitalId').populate('occupation').populate('appointmentId').exec();
          if(!doctors){
               return res.status(404).json({
                    message: 'Doctors not found'
               });
          }
          res.json({
               doctors
          });
     } catch (error) {
          console.log(error);
          res.status(500).json({
               message: 'No access'
          });
     }
};

export const getAllHospitals = async (_, res) => {
     try {
          const hospitals = await Hospital.find()
          .sort({
               time: 1,
               address: 1,
               imageUrl: 1
          });
          if(!hospitals){
               return res.status(404).json({
                    message: 'Hospitals not found'
               });
          }
          res.json({
               hospitals
          });
     } catch (error) {
          console.log(error);
          res.status(500).json({
               message: 'No access'
          });
     }
};

export const updateHospitalInfo = async (req, res) => {
     try {
          const updatedHospital = await Hospital.findByIdAndUpdate(req.body.id, {$set: {
               address: req.body.address,
               time: req.body.time, 
               phone: req.body.phone
          }});
          res.json(updatedHospital);
     } catch (err) {
          console.log(err);
          res.status(500).json({
               message: err
          });
     }
};

export const uploadHospitalImage = async (req, res) => {
     try {
          const hospitalWithUploadedImage = await Hospital.findByIdAndUpdate(req.body.id, {$set: {imageUrl: req.file.originalname}});
          res.json(hospitalWithUploadedImage);
     } catch (error) {
          console.log(error);
          res.status(500).json({
               message: 'Error'
          })
     }
}