import { ref, uploadBytes, getDownloadURL } from 'firebase/storage'
import { storage } from './firebase'

export async function uploadPollImage(
  file: File,
  pollId: string,
  optionId: string
): Promise<string> {
  const path = `polls/${pollId}/options/${optionId}`
  const storageRef = ref(storage, path)
  await uploadBytes(storageRef, file)
  return getDownloadURL(storageRef)
}
