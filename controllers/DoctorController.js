import Doctor from "../models/Doctor.js";
import Hospital from "../models/Hospital.js";
import Occupation from "../models/Occupation.js";
import BookedAppointment from "../models/BookedAppointment.js";
import { validationResult } from 'express-validator';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

export const register = async(req, res) => {
     try {
          const errors = validationResult(req);
          if (!errors.isEmpty()){
               return res.status(400).json(errors.array());
          }

          const checkHospital = await Hospital.findOne({$and: [
               {hospital: req.body.hospital}, 
               {city: req.body.city}, 
               {address: req.body.address}
          ]});
          let hospitalId;
          if(!checkHospital){
               const hospitalDocument = new Hospital({
                    hospital: req.body.hospital,
                    city: req.body.city,
                    address: req.body.address
               });
               const newHospital = await hospitalDocument.save();
               hospitalId = newHospital._id;
          } else {
               hospitalId = checkHospital._id
          }

          const checkOccupation = await Occupation.findOne({occupation: req.body.occupation});
          let occupationId;
          if(!checkOccupation){
               const occupationDocument = new Occupation({
                    occupation: req.body.occupation
               });
               const newOccupation = await occupationDocument.save();
               occupationId = newOccupation._id;
          } else {
               occupationId = checkOccupation._id
          }

          
          const password = req.body.password;
          const salt = await bcrypt.genSalt(10);
          const hPassword = await bcrypt.hash(password, salt);

          const doctorDocument = new Doctor({
               name: req.body.name,
               surname: req.body.surname,
               email: req.body.email,
               hashedPassword: hPassword,
               occupation: occupationId,
               experience: req.body.experience,
               hospitalId: hospitalId
          });

          const newDoctor = await doctorDocument.save();
          const token = jwt.sign({
               _id: newDoctor._id
          }, 'doctorkey', {
               expiresIn: '30m'
          });

          const {hashedPassword, ...doctorData} = newDoctor._doc

          res.json({
               token,
               doctorData
          })


     } catch (error) {
          console.log(error);
          res.status(500).json({
               message: 'Failed to doctor register'
          });
     }
     
};

export const login = async (req, res) => {
     try {
          const doctor = await Doctor.findOne({email: req.body.email});
          if (!doctor) {
               return res.status(404).json({
                    message: 'Doctor not found'
               });
          };

          const isValidPassword = await bcrypt.compare(req.body.password, doctor._doc.hashedPassword);
          if (!isValidPassword) {
               return res.status(400).json({
                    message: 'Incorrect email or password'
               });
          };

          const token = jwt.sign({
               _id: doctor._id
          }, 'doctorkey', {
               expiresIn: '30m'
          });

          const { hashedPassword, ...doctorData } = doctor._doc;

          res.json({
               ...doctorData,
               token
          });
     } catch (error) {
          console.log(error);
          res.status(500).json({
               message: 'Failed to log in doctor'
          });
     }
}

export const getAllDoctors = async (req, res) => {
     try {
          const doctors = await Doctor.find({access:  true})
               .populate('hospitalId')
               .populate('occupation')
               .populate('appointmentId')
               .exec();
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

export const getMyProfile = async (req, res) => {
     try {
          const doctor = await Doctor.findById(req.doctorId)
               .populate('hospitalId')
               .populate('occupation')
               exec();

          if(!doctor){
               return res.status(404).json({
                    message: 'Doctor not found'
               });
          }
          res.json(doctor);
     } catch (error) {
          console.log(error);
          res.status(500).json({
               message: 'No access'
          });
     }
};

export const uploadProfilePicture = async (req, res) => {
     try {
          const uploadDocImg = await Doctor.updateOne({_id: req.body.id}, {$set: {imageUrl: req.file.originalname}});
          if(uploadDocImg.matchedCount == 0){
               return res.status(404).json({
                    message: 'Doctor not found'
               });
          }
          res.json(uploadDocImg);
     } catch (error) {
          console.log(error);
          res.status(500).json({
               message: 'No access'
          });
     }
}

export const uploadCV = async (req, res) => {
     try {
          const uploadCV = await Doctor.updateOne({_id: req.body.id}, {$set: {cv: req.file.originalname}});
          if(uploadCV.matchedCount == 0){
               return res.status(404).json({
                    message: 'Doctor not found'
               });
          }
          res.json(uploadCV);
     } catch (error) {
          console.log(error);
          res.status(500).json({
               message: 'No access'
          });
     }
}

export const deleteProfilePicture = async (req, res) => {
     try {
          const uploadDocImg = await Doctor.updateOne(
               {_id: req.body.id}, 
               {$unset: {imageUrl: 1}}
          );
          if(uploadDocImg.matchedCount == 0){
               return res.status(404).json({
                    message: 'Doctor not found'
               });
          }
          res.json(uploadDocImg);
     } catch (error) {
          console.log(error);
          res.status(500).json({
               message: 'No access'
          });
     }
}

export const getAllMyNotStartedAppointments = async (req, res) => {
     try {
          const appointments = await BookedAppointment
                                     .find({$and: [{doctorId: req.doctorId}, {finished: false}]})
                                     .populate('userId', 'name surname dateOfBith gender')
                                     .exec();
          res.json(
               appointments
          );
     } catch (error) {
          console.log(error);
          res.status(500).json({
               message: 'No access'
          });
     }
}