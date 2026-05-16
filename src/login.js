// // src/login.js
// //@ts-nocheck
// const { createClient } = supabase


// let currentEmail = '' 

// async function sendOtp() {
//     const email = document.getElementById('otp-email').value.trim()
//     if (!email) return showToast('Enter your email', 'error')
    
//     const btn = document.getElementById('send-otp-btn')
//     setLoading(btn, true)

//     const { error } = await supabase.auth.signInWithOtp({
//         email,
//         options: {shouldCreateUser: true}
//     })

//     setLoading(btn, false, '<i class="fas fa-paper-plane mr-2 text-xs"></i>Send OTP Code')

//     if (error) return showToast(error.message, 'error')

//     currentEmail = email
//     document.getElementById('sent-to-email').textContent = email
//     document.getElementById('step-email').classList.add('hidden')
//     document.getElementById('step-otp').classList.remove('hidden')
//     document.querySelectorAll('.otp-box')[0].focus()

//     showToast('OTP sent — check your inbox', 'success')
//     startResendTimer(60)
// }

//  // ── Verify OTP ────────────────────────────────────────
//   async function verifyOTP() {
//     const boxes = document.querySelectorAll('.otp-box')
//     const token = Array.from(boxes).map(b => b.value).join('').trim()

//     if (token.length !== 6) return showToast('Enter the full 6-digit code', 'error')

//     const btn = document.getElementById('verify-otp-btn')
//     setLoading(btn, true)

//     const { data, error } = await supabase.auth.verifyOtp({
//       email: currentEmail,
//       token,
//       type: 'email'       // 'email' = OTP login, not magic link
//     })

//     setLoading(btn, false, '<i class="fas fa-check mr-2 text-xs"></i>Verify & Sign In')

//     if (error) {
//       showToast(error.message, 'error')
//       boxes.forEach(b => b.value = '')
//       boxes[0].focus()
//       return
//     }

//     // success — session is now set automatically by Supabase
//     showToast('Signed in! Redirecting...', 'success')
//     setTimeout(() => window.location.href = '/index.html', 1000)
//   }

//   // ── Resend OTP ────────────────────────────────────────
//   async function resendOTP() {
//     const { error } = await supabase.auth.signInWithOtp({
//       email: currentEmail,
//       options: { shouldCreateUser: false }
//     })
//     if (!error) {
//       document.querySelectorAll('.otp-box').forEach(b => b.value = '')
//       document.querySelectorAll('.otp-box')[0].focus()
//       showToast('New code sent', 'success')
//       startResendTimer(60)
//     }
//   }

//   // ── Reset password ────────────────────────────────────
//   async function sendResetEmail() {
//     const email = document.getElementById('reset-email').value.trim()
//     if (!email) return showToast('Enter your email', 'error')

//     const btn = document.getElementById('reset-btn')
//     setLoading(btn, true)

//     const { error } = await supabase.auth.resetPasswordForEmail(email, {
//       redirectTo: window.location.origin + '/reset.html'
//     })

//     setLoading(btn, false, '<i class="fas fa-envelope mr-2 text-xs"></i>Send Recovery Link')

//     if (error) return showToast(error.message, 'error')
//     showToast('Recovery link sent — check your inbox', 'success')
//     document.getElementById('reset-email').value = ''
//   }

//   // expose to html onclick=""
//   window.sendOTP         = sendOTP
//   window.verifyOTP       = verifyOTP
//   window.resendOTP       = resendOTP
//   window.sendResetEmail  = sendResetEmail

