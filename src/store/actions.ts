import {
  State,
  Character,
  Race,
  Gender,
  Attribute,
  Vital,
  Skill,
  Training,
  LuminanceAura,
  Augmentation
} from "../types";
import firebase from "../firebase";
import { firestore } from 'firebase';


export default {
  shareBuild(context: any) {
    const db = firebase.firestore();

    db.collection("builds")
      .add(context.state.character as firestore.DocumentData)
      .then(function (doc: firestore.DocumentData) {
        context.commit("addNotification", {
          type: "success",
          message: "Successfully shared build!"
        });

        context.state.sharedBuild = doc.id;
      })
      .catch(error => {
        context.commit("addNotification", {
          type: "error",
          message: "Failed to share build: " + error + "."
        });
      });
  },
  loadRemoteBuild(context: any, build_id: string) {
    context.commit("addNotification", {
      type: "info",
      message: "Loading build from share link.. *portal sounds*."
    });

    const db = firebase.firestore();

    db.collection("builds")
      .doc(build_id)
      .get()
      .then(function (doc: firestore.DocumentData) {
        context.state.character = doc.data() as Character;

        context.commit("addNotification", {
          type: "success",
          message: "Successfully loaded build!"
        });
      })
      .catch(error => {
        context.commit("addNotification", {
          type: "error",
          message: "Failed to load build: " + error + "."
        });
      });
  },
  import(context: any, character: any) {
    context.state.character = character;

    context.commit("addNotification", {
      type: "success",
      message: "Successfully imported build."
    });
  },
}