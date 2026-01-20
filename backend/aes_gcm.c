#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <openssl/evp.h>
#include <openssl/rand.h>

#define KEY_SIZE 32
#define IV_SIZE 12
#define SALT_SIZE 16
#define TAG_SIZE 16
#define BUF_SIZE 4096
#define PBKDF2_ITERS 100000

void derive_key(const char *password,
                unsigned char *salt,
                unsigned char *key) {
    PKCS5_PBKDF2_HMAC(
        password,
        strlen(password),
        salt,
        SALT_SIZE,
        PBKDF2_ITERS,
        EVP_sha256(),
        KEY_SIZE,
        key
    );
}

void encrypt_file(const char *password,
                  const char *infile,
                  const char *outfile) {

    FILE *in = fopen(infile, "rb");
    FILE *out = fopen(outfile, "wb");
    if (!in || !out) {
        perror("File error");
        exit(1);
    }

    unsigned char key[KEY_SIZE];
    unsigned char iv[IV_SIZE];
    unsigned char salt[SALT_SIZE];
    unsigned char tag[TAG_SIZE];
    unsigned char inbuf[BUF_SIZE], outbuf[BUF_SIZE + 16];

    int len, outlen;

    RAND_bytes(salt, SALT_SIZE);
    RAND_bytes(iv, IV_SIZE);
    derive_key(password, salt, key);

    // Write salt + iv
    fwrite(salt, 1, SALT_SIZE, out);
    fwrite(iv, 1, IV_SIZE, out);

    EVP_CIPHER_CTX *ctx = EVP_CIPHER_CTX_new();
    EVP_EncryptInit_ex(ctx, EVP_aes_256_gcm(), NULL, NULL, NULL);
    EVP_CIPHER_CTX_ctrl(ctx, EVP_CTRL_GCM_SET_IVLEN, IV_SIZE, NULL);
    EVP_EncryptInit_ex(ctx, NULL, NULL, key, iv);

    while ((len = fread(inbuf, 1, BUF_SIZE, in)) > 0) {
        EVP_EncryptUpdate(ctx, outbuf, &outlen, inbuf, len);
        fwrite(outbuf, 1, outlen, out);
    }

    EVP_EncryptFinal_ex(ctx, outbuf, &outlen);
    EVP_CIPHER_CTX_ctrl(ctx, EVP_CTRL_GCM_GET_TAG, TAG_SIZE, tag);
    fwrite(tag, 1, TAG_SIZE, out);

    EVP_CIPHER_CTX_free(ctx);
    fclose(in);
    fclose(out);
}

void decrypt_file(const char *password,
                  const char *infile,
                  const char *outfile) {

    FILE *in = fopen(infile, "rb");
    FILE *out = fopen(outfile, "wb");
    if (!in || !out) {
        perror("File error");
        exit(1);
    }

    unsigned char key[KEY_SIZE];
    unsigned char iv[IV_SIZE];
    unsigned char salt[SALT_SIZE];
    unsigned char tag[TAG_SIZE];
    unsigned char inbuf[BUF_SIZE], outbuf[BUF_SIZE];

    int len, outlen, ret;

    fread(salt, 1, SALT_SIZE, in);
    fread(iv, 1, IV_SIZE, in);
    derive_key(password, salt, key);

    fseek(in, -TAG_SIZE, SEEK_END);
    fread(tag, 1, TAG_SIZE, in);
    fseek(in, SALT_SIZE + IV_SIZE, SEEK_SET);

    EVP_CIPHER_CTX *ctx = EVP_CIPHER_CTX_new();
    EVP_DecryptInit_ex(ctx, EVP_aes_256_gcm(), NULL, NULL, NULL);
    EVP_CIPHER_CTX_ctrl(ctx, EVP_CTRL_GCM_SET_IVLEN, IV_SIZE, NULL);
    EVP_DecryptInit_ex(ctx, NULL, NULL, key, iv);

    while ((len = fread(inbuf, 1, BUF_SIZE, in)) > TAG_SIZE) {
        EVP_DecryptUpdate(ctx, outbuf, &outlen, inbuf, len);
        fwrite(outbuf, 1, outlen, out);
    }

    EVP_CIPHER_CTX_ctrl(ctx, EVP_CTRL_GCM_SET_TAG, TAG_SIZE, tag);
    ret = EVP_DecryptFinal_ex(ctx, outbuf, &outlen);

    EVP_CIPHER_CTX_free(ctx);
    fclose(in);
    fclose(out);

    if (ret <= 0) {
        fprintf(stderr, "Decryption failed\n");
        exit(1);
    }
}

int main(int argc, char *argv[]) {
    if (argc != 5) {
        fprintf(stderr,
            "Usage: %s encrypt|decrypt <password> <infile> <outfile>\n",
            argv[0]);
        return 1;
    }

    const char *mode = argv[1];
    const char *password = argv[2];
    const char *infile = argv[3];
    const char *outfile = argv[4];

    if (strcmp(mode, "encrypt") == 0) {
        encrypt_file(password, infile, outfile);
    } else if (strcmp(mode, "decrypt") == 0) {
        decrypt_file(password, infile, outfile);
    } else {
        fprintf(stderr, "Invalid mode (use encrypt or decrypt)\n");
        return 1;
    }

    return 0;
}
